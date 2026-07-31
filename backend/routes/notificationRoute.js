import express from 'express'
import { deleteNotification, getNotifications, readNotification, readNotifications } from '../controllers/notificationController.js'
import authUser from '../middleware/auth.js'

const notificationRouter = express.Router()

notificationRouter.post('/list', authUser, getNotifications)
notificationRouter.post('/read', authUser, readNotifications)
notificationRouter.post('/read-one', authUser, readNotification)
notificationRouter.post('/delete', authUser, deleteNotification)

export default notificationRouter
