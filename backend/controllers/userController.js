import { loginUserService, registerUserService, adminSignupService, adminLoginService, forgotPasswordService, resetPasswordService, getUserProfileService, uploadUserAvatarService, deleteUserAvatarService, listUsersAdminService, updateUserAdminService, deleteUserAdminService } from "../services/userService.js";

const loginUser = async (req, res) => {
  try {
    res.json(await loginUserService(req.body))
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message })
  }
}

const registerUser = async (req, res) => {
  try {
    res.json(await registerUserService(req.body))
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message })
  }
}

const getUserProfile = async (req, res) => {
  try {
    res.json(await getUserProfileService(req.body))
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message })
  }
}

const uploadUserAvatar = async (req, res) => {
  try {
    res.json(await uploadUserAvatarService({ userId: req.userId }, req.file))
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const deleteUserAvatar = async (req, res) => {
  try {
    res.json(await deleteUserAvatarService({ userId: req.userId }))
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const listUsersAdmin = async (req, res) => {
  try {
    res.json(await listUsersAdminService())
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const updateUserAdmin = async (req, res) => {
  try {
    res.json(await updateUserAdminService(req.body))
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const deleteUserAdmin = async (req, res) => {
  try {
    res.json(await deleteUserAdminService(req.body))
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const forgotPassword = async (req, res) => {
  try {
    res.json(await forgotPasswordService(req.body))
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message })
  }
}

const resetPassword = async (req, res) => {
  try {
    res.json(await resetPasswordService(req.params.token, req.body))
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message })
  }
}

const adminLogin = async (req, res) => {
  try {
    res.json(await adminLoginService(req.body))
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message })
  }
}

const adminSignup = async (req, res) => {
  try {
    res.json(await adminSignupService(req.body))
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message })
  }
}

export { loginUser, registerUser, adminSignup, adminLogin, forgotPassword, resetPassword, getUserProfile, uploadUserAvatar, deleteUserAvatar, listUsersAdmin, updateUserAdmin, deleteUserAdmin }
