import projectModel from "../../../models/project.model.js";

export class ProjectRepository {
  static async create(data) {
    return projectModel.create(data);
  }

  static async findById(projectId) {
    return projectModel.findById(projectId).populate("users", "email _id");
  }

  static async findSummariesByUserId(userId) {
    return projectModel
      .find({ users: userId })
      .select("_id name users createdBy createdAt updatedAt")
      .sort({ updatedAt: -1 })
      .lean();
  }

  static async updateFileTree(projectId, fileTree) {
    return projectModel.findByIdAndUpdate(
      projectId,
      { $set: { fileTree } },
      { new: true },
    );
  }
}
