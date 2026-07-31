import express from 'express'
import authUser from '../middleware/auth.js'
import { getUserMembership } from '../controllers/membershipController.js'

const membershipRouter = express.Router()

membershipRouter.post('/profile', authUser, getUserMembership)

export default membershipRouter
