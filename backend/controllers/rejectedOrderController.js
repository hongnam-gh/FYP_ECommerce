import { rejectOrderService, rejectedOrdersService } from '../services/rejectedOrderService.js'

const emitNotification = (req, result) => {
  if (!result.notification) return
  req.app.get('io').to(`user:${result.notification.userId}`).emit('notification:new', { notification: result.notification })
}

const emitAdminOrderUpdate = (req, result) => {
  if (!result.success) return
  req.app.get('io').to('admins').emit('admin-orders:update')
}

const rejectOrder = async (req, res) => {
  try {
    const result = await rejectOrderService(req.body)
    emitNotification(req, result)
    emitAdminOrderUpdate(req, result)
    res.json(result)
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const rejectedOrders = async (req, res) => {
  try {
    res.json(await rejectedOrdersService())
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

export { rejectOrder, rejectedOrders }
