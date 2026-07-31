import { waitForApproveOrdersService, approveOrderService } from '../services/waitForApproveService.js'

const emitNotification = (req, result) => {
  if (!result.notification) return
  req.app.get('io').to(`user:${result.notification.userId}`).emit('notification:new', { notification: result.notification })
}

const emitAdminOrderUpdate = (req, result) => {
  if (!result.success) return
  req.app.get('io').to('admins').emit('admin-orders:update')
}

const waitForApproveOrders = async (req, res) => {
  try {
    res.json(await waitForApproveOrdersService())
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const approveOrder = async (req, res) => {
  try {
    const result = await approveOrderService({ ...req.body, adminId: req.adminId, adminName: req.adminName })
    emitNotification(req, result)
    emitAdminOrderUpdate(req, result)
    res.json(result)
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

export { waitForApproveOrders, approveOrder }
