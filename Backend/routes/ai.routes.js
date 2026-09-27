import{Router} from 'express';
import * as aiController from '../controllers/ai.controller.js';
import * as authMiddleware from '../middlewares/auth.middleware.js';
const router = Router();


router.get('/get-result', authMiddleware.authUser, aiController.getResult);

router.post('/generate-project', aiController.generateProject);


export default router;