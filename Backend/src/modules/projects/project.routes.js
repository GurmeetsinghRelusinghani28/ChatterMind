import { Router } from "express";
import { createProject, listProjects } from "./project.controller.js";

const router = Router();

router.get("/", listProjects);
router.post("/", createProject);

export default router;
