import { AppError } from "../../common/errors/AppError.js";
import { ProjectRepository } from "./project.repository.js";

export class ProjectService {
  static async createProject({ name, userId }) {
    if (!name) {
      throw new AppError("Project name is required", 400, "VALIDATION_ERROR");
    }

    if (!userId) {
      throw new AppError("User is required", 400, "VALIDATION_ERROR");
    }

    return ProjectRepository.create({
      name,
      createdBy: userId,
      users: [userId],
    });
  }

  static async getProjectSummaries(userId) {
    return ProjectRepository.findSummariesByUserId(userId);
  }
}
