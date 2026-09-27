import userModel from '../models/user.model.js';
import {
    CACHE_TTL,
    cacheKeys,
    deleteCache,
    getCache,
    recordDatabaseRead,
    setCache,
} from './redis.service.js';


export const createUser = async ({
    email, password
}) => {

    if (!email || !password) {
        throw new Error('Email and password are required');
    }

    const hashedPassword = await userModel.hashPassword(password);

    const user = await userModel.create({
        email,
        password: hashedPassword
    });

    return user;
}

export const getAllUsers = async ({ userId }) => {
    const cacheValue = `excluding:${userId}`;
    const cachedUsers = await getCache('users', cacheValue);
    if (cachedUsers) return cachedUsers;

    recordDatabaseRead();
    const users = await userModel.find({
        _id: { $ne: userId } // Return all user accept logged in user
    }).select('_id email username').lean();
    await setCache('users', cacheValue, users, CACHE_TTL.profile);
    return users;
}

export const getUserProfile = async ({ userId }) => {
    const [namespace, key] = cacheKeys.profile(userId);
    const cachedProfile = await getCache(namespace, key);
    if (cachedProfile) return cachedProfile;

    recordDatabaseRead();
    const profile = await userModel.findById(userId).select('_id email username').lean();
    if (profile) await setCache(namespace, key, profile, CACHE_TTL.profile);
    return profile;
};

export const updateUserProfile = async ({ userId, username }) => {
    const profile = await userModel.findByIdAndUpdate(
        userId,
        { username: username.trim() },
        { new: true, runValidators: true },
    ).select('_id email username').lean();
    const [namespace, key] = cacheKeys.profile(userId);
    await deleteCache(namespace, key);
    await deleteCache('users', `excluding:${userId}`);
    return profile;
};