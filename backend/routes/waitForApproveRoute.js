import express from 'express'
import adminAuth from '../middleware/adminAuth.js'
import { waitForApproveOrders, approveOrder } from '../controllers/waitForApproveController.js'

const waitForApproveRouter = express.Router()

waitForApproveRouter.post('/list', adminAuth, waitForApproveOrders)
waitForApproveRouter.post('/approve', adminAuth, approveOrder)

export default waitForApproveRouter
