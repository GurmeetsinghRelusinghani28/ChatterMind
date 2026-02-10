import ProjectModel from "../models/project.model.js";
import userModel from "../models/user.model.js";
import * as projectService from "../services/project.service.js";
import { validationResult } from "express-validator";

// Create Project
export const createProject = async (req, res) => {
  try {
    console.log("Create project request received:", req.body);
    console.log("User making request:", req.user);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Validation errors:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { name } = req.body;

    // Create new project using service
    const newProject = await projectService.createProject({
      name,
      userId: req.user._id,
    });

    console.log("Project created:", newProject);

    // Populate user details
    const populatedProject = await ProjectModel.findById(newProject._id)
      .populate("users", "email name _id")
      .exec();

    console.log("Populated project:", populatedProject);

    res.status(201).json({
      message: "Project created successfully",
      project: populatedProject,
    });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Get All Projects
export const getAllProjects = async (req, res) => {
  try {
    const loggedInUser = await userModel.findOne({ email: req.user.email });

    if (!loggedInUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const allUserProject = await projectService.getAllProjectsByUserId({
      userId: loggedInUser._id,
    });

    return res.status(200).json({
      projects: allUserProject,
    });
  } catch (err) {
    console.error("Error getting projects:", err);
    res.status(400).json({ message: err.message });
  }
};

// Add Users to Project
export const addUserToProject = async (req, res) => {
  console.log("=== addUserToProject Called ===");
  console.log("Request body:", req.body);
  console.log("User from auth:", req.user);

  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Validation errors:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { projectId, users } = req.body;

    if (!req.user?._id) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    console.log("Project ID:", projectId);
    console.log("Users to add:", users);
    console.log("Current user ID:", req.user._id);

    // Use the service layer function
    const updatedProject = await projectService.addUserToProject({
      projectId,
      users,
      userId: req.user._id,
    });

    console.log("Service returned:", updatedProject);

    res.status(200).json({
      message: "Users added successfully",
      addedCount: users.length,
      project: updatedProject,
    });
  } catch (error) {
    console.error("=== ERROR in addUserToProject ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);

    // Handle specific errors
    if (
      error.message.includes("not found") ||
      error.message.includes("Invalid") ||
      error.message.includes("required") ||
      error.message.includes("already collaborators")
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    if (error.message.includes("permission")) {
      return res.status(403).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get Project by ID
export const getProjectById = async (req, res) => {
  const { projectId } = req.params;

  console.log("Getting project by ID:", projectId);

  try {
    const project = await projectService.getProjectById({ projectId });
    return res.status(200).json(project);
  } catch (err) {
    console.error("Error getting project:", err);

    if (err.message.includes("not found") || err.message.includes("Invalid")) {
      return res.status(400).json({ message: err.message });
    }

    res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Update File Tree
export const updateFileTree = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { projectId, fileTree } = req.body;
    const project = await projectService.updateFileTree({
      projectId,
      fileTree,
    });

    return res.status(200).json({
      project,
    });
  } catch (err) {
    console.error("Error updating file tree:", err);

    if (err.message.includes("not found") || err.message.includes("Invalid")) {
      return res.status(400).json({ message: err.message });
    }

    res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};
