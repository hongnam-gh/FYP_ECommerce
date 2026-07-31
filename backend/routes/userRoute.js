import express from 'express';
import authUser from '../middleware/auth.js';
import adminAuth from '../middleware/adminAuth.js';
import upload from '../middleware/multer.js';
import { loginUser, registerUser, adminSignup, adminLogin, forgotPassword, resetPassword, getUserProfile, uploadUserAvatar, deleteUserAvatar, listUsersAdmin, updateUserAdmin, deleteUserAdmin } from '../controllers/userController.js';

const userRouter = express.Router();

userRouter.post('/register', registerUser)
userRouter.post('/login', loginUser)
userRouter.post('/admin-signup', adminSignup)
userRouter.post('/admin', adminLogin)
userRouter.post('/forgot-password', forgotPassword)
userRouter.post('/reset-password/:token', resetPassword)
userRouter.post('/profile', authUser, getUserProfile)
userRouter.post('/avatar', authUser, upload.single('avatar'), uploadUserAvatar)
userRouter.post('/avatar/delete', authUser, deleteUserAvatar)
userRouter.get('/admin-list', adminAuth, listUsersAdmin)
userRouter.post('/admin-update', adminAuth, updateUserAdmin)
userRouter.post('/admin-delete', adminAuth, deleteUserAdmin)

export default userRouter;
