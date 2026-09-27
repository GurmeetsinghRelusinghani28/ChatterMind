import mongoose from 'mongoose';
import projectModel from '../models/project.model.js';
import {
    CACHE_TTL,
    cacheKeys,
    deleteCacheByPattern,
    getCache,
    recordDatabaseRead,
    setCache,
} from './redis.service.js';


export const createProject = async ({name,userId}) => {
    const normalizedName = typeof name === 'string' ? name.trim().toLowerCase() : '';

    if(!normalizedName){
        throw new Error('Name is required');
    }
    if(!userId){
        throw new Error('User is required');
    }
    const existingProject = await projectModel.findOne({ name: normalizedName }).select('_id').lean();
    if (existingProject) {
        const duplicateError = new Error('A project with this name already exists. Choose a different name.');
        duplicateError.code = 'PROJECT_NAME_CONFLICT';
        throw duplicateError;
    }

    try {
        const project = await projectModel.create({ name: normalizedName, users:[userId] });
        await deleteCacheByPattern('active-rooms');
        return project;
    } catch (error) {
        if (error?.code === 11000 && error?.keyPattern?.name) {
            const duplicateError = new Error('A project with this name already exists. Choose a different name.');
            duplicateError.code = 'PROJECT_NAME_CONFLICT';
            throw duplicateError;
        }
        throw new Error(error.message);
    }
}


export const getAllProjectsByUserId = async ({userId})=>{
if(!userId){
    throw new Error('UserId is required');
}

const [namespace, key] = cacheKeys.activeRooms(userId);
const cachedProjects = await getCache(namespace, key);
if (cachedProjects) return cachedProjects;

recordDatabaseRead();
const allUserProject = await projectModel.find({users:userId}).sort({ createdAt: -1 }).lean();
await setCache(namespace, key, allUserProject, CACHE_TTL.activeRooms);

return allUserProject;
}


// In project.service.js - temporary simplified version
export const addUserToProject = async ({projectId, users, userId}) => {
  console.log('Service called with:', {projectId, users, userId});
  
  // Basic validation
  if (!projectId) throw new Error('ProjectId is required');
  if (!users || !Array.isArray(users)) throw new Error('Users array is required');
  if (!userId) throw new Error('UserId is required');
  
  // Just add the users without permission check for now
  const updatedProject = await projectModel.findByIdAndUpdate(
    projectId,
    { $addToSet: { users: { $each: users } } },
    { new: true }
  );
  
  if (!updatedProject) throw new Error('Project not found');
    await deleteCacheByPattern('active-rooms');
  return updatedProject;
}

export const getProjectById = async({projectId}) => {
    if(!projectId){
        throw new Error('ProjectId is required');
    }
    if(!mongoose.Types.ObjectId.isValid(projectId)){
        throw new Error('Invalid ProjectId');
    }
    const project = await projectModel.findOne({
        _id: projectId
    }).populate('users');

    console.log(project);
    return project;

}


export const updateFileTree = async({projectId, fileTree}) => {
    if(!projectId){
        throw new Error('ProjectId is required');
    }
    if(!mongoose.Types.ObjectId.isValid(projectId)){
        throw new Error('Invalid ProjectId');
    }
    if(!fileTree){
        throw new Error('fileTree is required');
    }

    const updatedProject = await projectModel.findOneAndUpdate({
        _id: projectId
    },
    {
        fileTree
    },
    {
        new: true
    })

    await deleteCacheByPattern('active-rooms');
    return updatedProject;
}
