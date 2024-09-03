import express from "express";
import {
  handleTestUser,
  handleSignupNewUser,
  handleLoginUser,
  handleCheckIsUserLoggedIn,
  handleUpdateUser,
  handleDeleteAccount,
  handleSignOutUser,
  handleGetAllUsersDetails,
  handleDeleteUserAccountFromDashboard,
  handleForgotPassword,
  handleResetPassword
} from "../controllers/userController.js";
import { upload } from "../middlewear/multer.middlewear.js";
import { verifyUser } from "../middlewear/verifyUser.js";



const router = express.Router();

router.get("/test", handleTestUser);

router.post("/signup", upload.single("profilePicture"), handleSignupNewUser);

router.post("/login", handleLoginUser);

router.post("/signout", verifyUser, handleSignOutUser);

router.get("/me", handleCheckIsUserLoggedIn);

router.post("/update/:id", upload.single("profilePicture"), handleUpdateUser);

router.delete("/delete/:id", verifyUser, handleDeleteAccount);

router.get('/allUsers', verifyUser, handleGetAllUsersDetails);

router.delete('/delete-account/:userId', verifyUser, handleDeleteUserAccountFromDashboard);

router.post('/forgot-password', handleForgotPassword);

router.post('/reset-password/:userId', handleResetPassword);


export default router;