import express from 'express'
import { placeOrder, placeOrderStripe, allOrders, userOrders, singleOrder, cancelOrder, updateStatus, verifyStripe, placeOrderMomo, verifyMomo } from '../controllers/orderController.js'
import { waitForApproveOrders, approveOrder } from '../controllers/waitForApproveController.js'
import { rejectOrder } from '../controllers/rejectedOrderController.js'
import adminAuth from '../middleware/adminAuth.js'
import authUser from '../middleware/auth.js'

const orderRouter = express.Router()

// Admin Features
orderRouter.post('/list', adminAuth, allOrders)
orderRouter.post('/wait-for-approve', adminAuth, waitForApproveOrders)
orderRouter.post('/approve', adminAuth, approveOrder)
orderRouter.post('/reject', adminAuth, rejectOrder)
orderRouter.post('/status', adminAuth, updateStatus)

// Payment Features
orderRouter.post('/place', authUser, placeOrder)
orderRouter.post('/stripe', authUser, placeOrderStripe)
orderRouter.post('/momo', authUser, placeOrderMomo)

// User Feature
orderRouter.post('/userorders', authUser, userOrders)
orderRouter.post('/single', authUser, singleOrder)
orderRouter.post('/cancel', authUser, cancelOrder)

// Verify Payment
orderRouter.post('/verifyStripe', authUser, verifyStripe)
orderRouter.post('/verifyMomo', authUser, verifyMomo)

export default orderRouter
