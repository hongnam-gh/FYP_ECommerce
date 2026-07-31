import { placeOrderService, placeOrderStripeService, verifyStripeService, placeOrderMomoService, verifyMomoService, allOrdersService, userOrdersService, singleOrderService, cancelOrderService, updateStatusService } from '../services/orderService.js'

const emitNotification = (req, result) => {
  if (!result.notification) return
  req.app.get('io').to(`user:${result.notification.userId}`).emit('notification:new', { notification: result.notification })
}

const emitAdminOrderUpdate = (req, result) => {
  if (!result.success) return
  req.app.get('io').to('admins').emit('admin-orders:update')
}

const placeOrder = async (req, res) => {
  try {
    const result = await placeOrderService(req.body)
    emitNotification(req, result)
    emitAdminOrderUpdate(req, result)
    res.json(result)
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const placeOrderStripe = async (req, res) => {
  try {
    res.json(await placeOrderStripeService(req.body, req.headers.origin))
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const verifyStripe = async (req, res) => {
  try {
    const result = await verifyStripeService(req.body)
    emitNotification(req, result)
    emitAdminOrderUpdate(req, result)
    res.json(result)
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const placeOrderMomo = async (req, res) => {
  try {
    res.json(await placeOrderMomoService(req.body))
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const verifyMomo = async (req, res) => {
  try {
    const result = await verifyMomoService(req.body)
    emitNotification(req, result)
    emitAdminOrderUpdate(req, result)
    res.json(result)
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const allOrders = async (req, res) => {
  try {
    res.json(await allOrdersService())
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const userOrders = async (req, res) => {
  try {
    res.json(await userOrdersService(req.body))
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const singleOrder = async (req, res) => {
  try {
    res.json(await singleOrderService(req.body))
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const cancelOrder = async (req, res) => {
  try {
    const result = await cancelOrderService(req.body)
    emitAdminOrderUpdate(req, result)
    res.json(result)
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const updateStatus = async (req, res) => {
  try {
    const result = await updateStatusService(req.body)
    emitNotification(req, result)
    emitAdminOrderUpdate(req, result)
    res.json(result)
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

export { verifyStripe, verifyMomo, placeOrder, placeOrderStripe, placeOrderMomo, allOrders, userOrders, singleOrder, cancelOrder, updateStatus }
