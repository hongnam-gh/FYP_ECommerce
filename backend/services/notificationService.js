import notificationModel from '../models/notificationModel.js'
import orderModel from '../models/orderModel.js'
import waitForApproveModel from '../models/waitForApproveModel.js'
import rejectedOrderModel from '../models/rejectedOrderModel.js'

// ------ Business Helpers --------

const getFirstProduct = (items = []) => {
  const product = items[0]
  if (!product) return { productId: '', productImage: '' }

  return {
    productId: String(product._id || product.productId || ''),
    productImage: Array.isArray(product.image) ? product.image[0] || '' : product.image || ''
  }
}

// ------ Public Services --------

const createNotificationService = async ({ userId, orderId = '', productId = '', productImage = '', items = [], type, title, message, status = '' }) => {
  if (!userId || (!orderId && !productId) || !type || !title || !message) return null

  const firstProduct = getFirstProduct(items)

  return await notificationModel.create({ userId, orderId, productId: productId || firstProduct.productId, productImage: productImage || firstProduct.productImage, type, title, message, status, read: false, date: Date.now() })
}

const getNotificationsService = async (userId) => {
  if (!userId) return { success: false, message: 'User not found' }

  const notifications = await notificationModel.find({ userId }).sort({ date: -1 }).limit(50).lean()
  const orderIds = [...new Set(notifications.map((notification) => notification.orderId).filter(Boolean))]

  const [orders, waitingOrders, rejectedOrders] = await Promise.all([
    orderModel.find({ _id: { $in: orderIds } }).select('items').lean(),
    waitForApproveModel.find({ _id: { $in: orderIds } }).select('items').lean(),
    rejectedOrderModel.find({ _id: { $in: orderIds } }).select('items').lean()
  ])

  const orderMap = new Map([...orders, ...waitingOrders, ...rejectedOrders].map((order) => [String(order._id), order]))
  const notificationList = notifications.map((notification) => {
    if (notification.productImage || !notification.orderId) return notification

    const firstProduct = getFirstProduct(orderMap.get(notification.orderId)?.items)
    return { ...notification, productId: notification.productId || firstProduct.productId, productImage: firstProduct.productImage }
  })

  return { success: true, notifications: notificationList }
}

const readNotificationsService = async (userId) => {
  if (!userId) return { success: false, message: 'User not found' }

  await notificationModel.updateMany({ userId, read: false }, { read: true })
  return { success: true, message: 'Notifications read' }
}

const readNotificationService = async ({ userId, notificationId }) => {
  if (!userId || !notificationId) return { success: false, message: 'Notification not found' }

  const notification = await notificationModel.findOneAndUpdate({ _id: notificationId, userId }, { read: true }, { new: true })

  if (!notification) return { success: false, message: 'Notification not found' }
  return { success: true, notification }
}

const deleteNotificationService = async ({ userId, notificationId }) => {
  if (!userId || !notificationId) return { success: false, message: 'Notification not found' }

  const notification = await notificationModel.findOneAndDelete({ _id: notificationId, userId })
  if (!notification) return { success: false, message: 'Notification not found' }

  return { success: true, message: 'Notification deleted' }
}

export { createNotificationService, getNotificationsService, readNotificationsService, readNotificationService, deleteNotificationService }
