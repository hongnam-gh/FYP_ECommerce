import express from 'express'
import adminAuth from '../middleware/adminAuth.js'
import { rejectOrder, rejectedOrders } from '../controllers/rejectedOrderController.js'

const rejectedOrderRouter = express.Router()

rejectedOrderRouter.post('/list', adminAuth, rejectedOrders)
rejectedOrderRouter.post('/reject', adminAuth, rejectOrder)

export default rejectedOrderRouter
