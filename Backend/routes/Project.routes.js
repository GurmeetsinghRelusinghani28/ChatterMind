import {Router} from "express";
import {body} from 'express-validator';
import * as projectControllers from '../controllers/project.controller.js'
import * as authMiddleWare from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/create',
    authMiddleWare.authUser,
    body('name').isString().withMessage('name is Required'),
    projectControllers.createProject
)


router.get('/all',
    authMiddleWare.authUser,
    projectControllers.getAllProjects
)

router.put('/addusers',
    authMiddleWare.authUser,
    body('projectId').isString().withMessage('projectId is required').bail(),
    body('users').isArray({ min: 1 }).withMessage('user is required and should be an array of strings').bail()
        .custom((users) => users.every(user => typeof user === 'string')).withMessage('each user should be a string'),
    projectControllers.addUserToProject
)

router.get("/get-project/:projectId",
    authMiddleWare.authUser,
    projectControllers.getProjectById
)

router.put('/update-file-tree',
    authMiddleWare.authUser,
    body('projectId').isString().withMessage('projectId is required').bail(),
    body('fileTree').isObject().withMessage('fileTree is required').bail(),
    projectControllers.updateFileTree
)

// Add to project.routes.js
router.get('/test-error', (req, res) => {
  // This will test if routes are working
  res.json({ message: 'Test endpoint working', timestamp: new Date() });
});

export default router;