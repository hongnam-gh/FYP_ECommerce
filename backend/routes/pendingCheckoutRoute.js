import express from 'express'
import { cancelPendingCheckout } from '../controllers/pendingCheckoutController.js'
import authUser from '../middleware/auth.js'

const pendingCheckoutRouter = express.Router()

pendingCheckoutRouter.post('/cancel', authUser, cancelPendingCheckout)

export default pendingCheckoutRouter
