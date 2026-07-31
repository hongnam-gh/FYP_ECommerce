import validator from "validator";
import bcrypt from "bcrypt"
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import fs from 'fs'
import { v2 as cloudinary } from 'cloudinary'
import userModel from '../models/userModel.js'
import socialAuthModel from '../models/socialAuthModel.js'
import adminModel from '../models/adminModel.js'
import passwordResetModel from '../models/passwordResetModel.js'
import { sendResetPasswordEmail } from "./emailService.js";
import { syncMembershipService } from './membershipService.js'

// ------ Business Helpers --------

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET)
}

const createAdminToken = (id) => {
  return jwt.sign({ id, role: 'admin' }, process.env.JWT_SECRET)
}

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// ------ Public Services --------

const loginUserService = async ({ email, password }) => {
  const user = await userModel.findOne({ email })

  if (!user) return { success: false, message: "User does not exists" }
  if (!user.password) return { success: false, message: 'Please login with Google or Facebook' }

  const isMatch = await bcrypt.compare(password, user.password)

  if (!isMatch) return { success: false, message: 'Password incorrect' }

  const token = createToken(user._id)
  return { success: true, token }
}

const registerUserService = async ({ name, email, password }) => {
  const exists = await userModel.findOne({ email });
  if (exists) return { success: false, message: "User is exists" }

  if (!validator.isEmail(email)) return { success: false, message: "Please enter a valid email" }
  if (password.length < 8) return { success: false, message: "Please enter a strong password, it must be over 8 letters" }

  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(password, salt)
  const newUser = new userModel({ name, email, password: hashedPassword })
  const user = await newUser.save()
  const token = createToken(user._id)

  return { success: true, token }
}

const getUserProfileService = async ({ userId }) => {
  const user = await userModel.findById(userId).select('-password')

  if (!user) return { success: false, message: "User not found" }

  const [socialAuth, membershipResult] = await Promise.all([
    socialAuthModel.findOne({ userId }).select('provider'),
    syncMembershipService(userId)
  ])

  return { success: true, user, socialProvider: socialAuth?.provider || '', accountStats: membershipResult.membership }
}

const uploadUserAvatarService = async ({ userId }, file) => {
  if (!file) return { success: false, message: 'Please select an avatar image' }

  try {
    if (!file.mimetype?.startsWith('image/')) return { success: false, message: 'Avatar must be an image' }
    if (file.size > 5 * 1024 * 1024) return { success: false, message: 'Avatar must be smaller than 5MB' }

    const socialAuth = await socialAuthModel.findOne({ userId })
    if (socialAuth) return { success: false, message: 'Social account avatar cannot be changed' }

    const user = await userModel.findById(userId)
    if (!user) return { success: false, message: 'User not found' }

    const result = await cloudinary.uploader.upload(file.path, {
      resource_type: 'image',
      folder: 'distressed/avatars',
      public_id: userId,
      overwrite: true,
      transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }]
    })

    user.avatar = result.secure_url
    await user.save()

    return { success: true, avatar: user.avatar }
  } finally {
    if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path)
  }
}

const deleteUserAvatarService = async ({ userId }) => {
  const socialAuth = await socialAuthModel.findOne({ userId })
  if (socialAuth) return { success: false, message: 'Social account avatar cannot be changed' }

  const user = await userModel.findById(userId)
  if (!user) return { success: false, message: 'User not found' }

  if (user.avatar) {
    const avatarPath = user.avatar.split('/upload/')[1]?.replace(/^v\d+\//, '').replace(/\.[^/.]+$/, '')
    if (avatarPath) await cloudinary.uploader.destroy(avatarPath)
  }

  user.avatar = ''
  await user.save()

  return { success: true, avatar: '' }
}

const listUsersAdminService = async () => {
  const users = await userModel.find({}).select('-password -cartData').sort({ name: 1 }).lean()
  return { success: true, users }
}

const updateUserAdminService = async ({ id, name, email }) => {
  const userName = name?.trim()
  const userEmail = email?.trim()

  if (!userName) return { success: false, message: 'User name is required' }
  if (!userEmail || !validator.isEmail(userEmail)) return { success: false, message: 'Please enter a valid email' }

  const existingUser = await userModel.findOne({ email: { $regex: `^${escapeRegex(userEmail)}$`, $options: 'i' }, _id: { $ne: id } })
  if (existingUser) return { success: false, message: 'Email already exists' }

  const user = await userModel.findByIdAndUpdate(id, { name: userName, email: userEmail }, { new: true, runValidators: true }).select('-password -cartData')
  if (!user) return { success: false, message: 'User not found' }

  return { success: true, message: 'User updated successfully', user }
}

const deleteUserAdminService = async ({ id }) => {
  const user = await userModel.findById(id)
  if (!user) return { success: false, message: 'User not found' }

  if (user.avatar && user.avatar.includes('cloudinary.com')) {
    const avatarPath = user.avatar.split('/upload/')[1]?.replace(/^v\d+\//, '').replace(/\.[^/.]+$/, '')
    if (avatarPath) await cloudinary.uploader.destroy(avatarPath)
  }

  await Promise.all([
    socialAuthModel.deleteMany({ userId: id }),
    passwordResetModel.deleteMany({ userId: id }),
    userModel.findByIdAndDelete(id)
  ])

  return { success: true, message: 'User disabled successfully' }
}

const forgotPasswordService = async ({ email }) => {
  if (!email || !validator.isEmail(email)) return { success: false, message: "Please enter a valid email" }

  const user = await userModel.findOne({ email })

  if (!user) return { success: false, message: "User does not exist" }

  await passwordResetModel.deleteMany({ userId: user._id.toString() })

  const resetToken = crypto.randomBytes(32).toString('hex')
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')

  const resetData = new passwordResetModel({
    userId: user._id.toString(),
    email: user.email,
    token: hashedToken,
    expiresAt: Date.now() + 15 * 60 * 1000,
    used: false,
    date: Date.now()
  })

  await resetData.save()

  const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`
  await sendResetPasswordEmail(user.email, resetLink)

  return { success: true, message: "A Resit Password Link Has Been Sent to Your Email" }
}

const resetPasswordService = async (token, { password, confirmPassword }) => {
  if (!password || !confirmPassword) return { success: false, message: "Please fill all fields" }
  if (password !== confirmPassword) return { success: false, message: "Passwords do not match" }
  if (password.length < 8) return { success: false, message: "Please enter a strong password, it must be over 8 letters" }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
  const resetRequest = await passwordResetModel.findOne({ token: hashedToken, used: false, expiresAt: { $gt: Date.now() } })

  if (!resetRequest) return { success: false, message: "Reset link is invalid or expired" }

  const user = await userModel.findById(resetRequest.userId)
  if (!user) return { success: false, message: "User not found" }

  const isSamePassword = await bcrypt.compare(password, user.password)
  if (isSamePassword) return { success: false, message: "Please enter new password different to your old password" }

  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(password, salt)

  await userModel.findByIdAndUpdate(resetRequest.userId, { password: hashedPassword })
  await passwordResetModel.findByIdAndUpdate(resetRequest._id, { used: true })

  return { success: true, message: "Password reset successfully" }
}

const adminSignupService = async ({ name, password, secretKey }) => {
  if (secretKey !== 'Nam') return { success: false, message: "Invalid secret key" }
  const adminName = name ? name.trim() : ''
  if (!adminName) return { success: false, message: "Please enter admin name" }
  if (!/^[\p{L}\s]+$/u.test(adminName)) return { success: false, message: "Admin name cannot include numbers or special characters" }

  const exists = await adminModel.findOne({ name: adminName })
  if (exists) return { success: false, message: "Admin is exists" }

  if (password.length < 8) return { success: false, message: "Please enter a strong password, it must be over 8 letters" }

  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(password, salt)
  const newAdmin = new adminModel({ name: adminName, password: hashedPassword })
  const admin = await newAdmin.save()
  const token = createAdminToken(admin._id)

  return { success: true, token, name: admin.name }
}

const adminLoginService = async ({ name, password, secretKey }) => {
  if (secretKey !== 'Nam') return { success: false, message: "Invalid secret key" }
  const adminName = name ? name.trim() : ''
  if (!adminName) return { success: false, message: "Please enter admin name" }
  if (!/^[\p{L}\s]+$/u.test(adminName)) return { success: false, message: "Admin name cannot include numbers or special characters" }

  const admin = await adminModel.findOne({ name: adminName })

  if (!admin) return { success: false, message: "Admin does not exists" }

  const isMatch = await bcrypt.compare(password, admin.password)

  if (!isMatch) return { success: false, message: 'Password incorrect' }

  const token = createAdminToken(admin._id)
  return { success: true, token, name: admin.name }
}

export { loginUserService, registerUserService, getUserProfileService, uploadUserAvatarService, deleteUserAvatarService, listUsersAdminService, updateUserAdminService, deleteUserAdminService, forgotPasswordService, resetPasswordService, adminSignupService, adminLoginService }
