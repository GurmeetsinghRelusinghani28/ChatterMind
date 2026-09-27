import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { ProjectService } from "./project.service.js";

export const createProject = asyncHandler(async (req, res) => {
  const project = await ProjectService.createProject({
    name: req.body.name,
    userId: req.user?._id,
  });

  res.status(201).json({ project });
});

export const listProjects = asyncHandler(async (req, res) => {
  const projects = await ProjectService.getProjectSummaries(req.user?._id);
  res.status(200).json({ projects });
});
