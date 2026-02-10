import mongoose from 'mongoose';
import projectModel from '../models/project.model.js';


export const createProject = async ({name,userId}) => {
    
    if(!name){
        throw new Error('Name is required');
    }
    if(!userId){
        throw new Error('User is required');
    }
    let project;
    try {
        project = await projectModel.create({name,users:[userId]});
    } catch (error) {
        throw new Error(error.message);
    }
    

    return project;
}


export const getAllProjectsByUserId = async ({userId})=>{
if(!userId){
    throw new Error('UserId is required');
}

const allUserProject = await projectModel.find({users:userId})

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

    return updatedProject;
}
