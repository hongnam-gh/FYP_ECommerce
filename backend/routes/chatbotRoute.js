import express from 'express'
import authUser from '../middleware/auth.js'
import { getChatbotHistory, replyChatbot, deleteChatbotMessage } from '../controllers/chatbotController.js'

const chatbotRouter = express.Router()

chatbotRouter.post('/history', authUser, getChatbotHistory)

chatbotRouter.post('/reply', authUser, replyChatbot)

chatbotRouter.post('/delete-message', authUser, deleteChatbotMessage)

export default chatbotRouter
