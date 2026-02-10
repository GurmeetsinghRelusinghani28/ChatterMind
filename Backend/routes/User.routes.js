import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { body } from "express-validator";
import * as userMiddleware from '../middlewares/auth.middleware.js';


const router = Router();

//  run on http://localhost:3000/users/register

router.post(
  "/register",
  body("email").isEmail().withMessage("Email must be a valid Email Address"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password mst be atleast 6 character long"),
  userController.createUserController
);

router.post(
  "/login",
  body("email").isEmail().withMessage("Email must be a valid Email Address"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password mst be atleast 6 character long"),
  userController.loginController
);

router.get(
  "/profile",userMiddleware.authUser,userController.profileController
);

router.get(
    "/logout",userMiddleware.authUser,userController.logoutController
  );

  router.get('/all', userMiddleware.authUser, userController.getAllUsersController);

export default router;
