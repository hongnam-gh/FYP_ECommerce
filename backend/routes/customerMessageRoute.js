import express from 'express'
import adminAuth from '../middleware/adminAuth.js'
import authUser from '../middleware/auth.js'
import { sendCustomerMessage, getAllCustomerMessages, startCustomerMessage, replyCustomerMessage, getCustomerMessage, deleteClientMessage, deleteAdminMessage, deleteConversation } from '../controllers/customerMessageController.js'

const customerMessageRouter = express.Router()

customerMessageRouter.post('/send', authUser, sendCustomerMessage)

customerMessageRouter.post('/client', getCustomerMessage)

customerMessageRouter.post('/delete-client-message', authUser, deleteClientMessage)

customerMessageRouter.post('/list', adminAuth, getAllCustomerMessages)

customerMessageRouter.post('/admin-start', adminAuth, startCustomerMessage)

customerMessageRouter.post('/reply', adminAuth, replyCustomerMessage)

customerMessageRouter.post('/delete-admin-message', adminAuth, deleteAdminMessage)

customerMessageRouter.post('/delete-conversation', adminAuth, deleteConversation)

export default customerMessageRouter
