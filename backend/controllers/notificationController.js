import { deleteNotificationService, getNotificationsService, readNotificationService, readNotificationsService } from '../services/notificationService.js'

const getNotifications = async (req, res) => {
  try {
    res.json(await getNotificationsService(req.body.userId))
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const readNotifications = async (req, res) => {
  try {
    res.json(await readNotificationsService(req.body.userId))
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const readNotification = async (req, res) => {
  try {
    res.json(await readNotificationService({ userId: req.body.userId, notificationId: req.body.notificationId }))
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const deleteNotification = async (req, res) => {
  try {
    res.json(await deleteNotificationService({ userId: req.body.userId, notificationId: req.body.notificationId }))
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

export { deleteNotification, getNotifications, readNotification, readNotifications }
