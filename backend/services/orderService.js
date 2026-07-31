import Stripe from 'stripe'
import adminModel from '../models/adminModel.js'
import orderModel from '../models/orderModel.js'
import userModel from '../models/userModel.js'
import waitForApproveModel from '../models/waitForApproveModel.js'
import rejectedOrderModel from '../models/rejectedOrderModel.js'
import cartModel from '../models/cartModel.js'
import { createWaitingOrderService } from './waitForApproveService.js'
import { createPendingCheckoutService, getPendingCheckoutService, deletePendingCheckoutService, cancelPendingCheckoutService, cleanupExpiredCheckoutsService } from './pendingCheckoutService.js'
import { createNotificationService } from './notificationService.js'
import { calculateMemberOrderService } from './membershipService.js'
import { reserveInventoryStock, releaseInventoryStock } from './inventoryStockService.js'

// ------ Config --------

const currency = 'usd'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// ------ Business Helpers --------

const isInvalidOrder = (items, amount, address) => {
  if (!items || !Array.isArray(items) || items.length === 0) return 'Cart is empty'
  if (!amount || Number(amount) <= 0) return 'Invalid order amount'
  if (!address || Object.keys(address).length === 0) return 'Delivery information is required'
  return null
}

const canCancelOrder = (status) => {
  return ['Order Placed', 'Packing'].includes(status)
}

const publicOrder = (order, approvalStatus = 'approved') => {
  const data = order.toObject ? order.toObject() : order
  return { ...data, approvalStatus }
}

// ------ Public Services --------

const placeOrderService = async ({ userId, items, amount, address }) => {
  const orderError = isInvalidOrder(items, amount, address)
  if (orderError) return { success: false, message: orderError }

  const pricing = await calculateMemberOrderService(userId, items)
  await cleanupExpiredCheckoutsService()
  const stockError = await reserveInventoryStock(pricing.items)
  if (stockError) return { success: false, message: stockError }

  let waitingOrder

  try {
    waitingOrder = await createWaitingOrderService({ userId, ...pricing, address, paymentMethod: 'COD', payment: false, stockReserved: true, date: Date.now() })
  } catch (error) {
    await releaseInventoryStock(pricing.items)
    throw error
  }

  const notification = await createNotificationService({ userId, orderId: waitingOrder._id.toString(), items: waitingOrder.items, type: 'pending', title: 'Order awaiting approval', message: 'Your order has been placed and is waiting for admin approval.' })
  await userModel.findByIdAndUpdate(userId, { cartData: {} })
  await cartModel.deleteMany({ userId })

  return { success: true, message: 'Order waiting for approve', notification }
}

const placeOrderStripeService = async ({ userId, items, amount, address }, origin) => {
  const orderError = isInvalidOrder(items, amount, address)
  if (orderError) return { success: false, message: orderError }

  const pricing = await calculateMemberOrderService(userId, items)
  await cleanupExpiredCheckoutsService()
  const stockError = await reserveInventoryStock(pricing.items)
  if (stockError) return { success: false, message: stockError }

  let pendingCheckout

  try {
    pendingCheckout = await createPendingCheckoutService({ userId, ...pricing, address, paymentMethod: 'Stripe', stockReserved: true })
  } catch (error) {
    await releaseInventoryStock(pricing.items)
    throw error
  }

  const line_items = [{ price_data: { currency, product_data: { name: `Distressed Order - ${pricing.membershipRank}` }, unit_amount: Math.round(pricing.amount * 100) }, quantity: 1 }]

  let session

  try {
    session = await stripe.checkout.sessions.create({
      success_url: `${origin}/verify?success=true&session_id={CHECKOUT_SESSION_ID}&checkoutId=${pendingCheckout._id}`,
      cancel_url: `${origin}/verify?success=false&checkoutId=${pendingCheckout._id}`,
      line_items,
      mode: 'payment',
      expires_at: Math.floor(pendingCheckout.expiresAt / 1000),
      metadata: { checkoutId: pendingCheckout._id.toString() },
    })
  } catch (error) {
    await deletePendingCheckoutService(pendingCheckout._id, true)
    throw error
  }

  return { success: true, session_url: session.url, checkoutId: pendingCheckout._id }
}

const verifyStripeService = async ({ session_id, userId }) => {
  if (!session_id) return { success: false, message: 'Missing Stripe session id' }

  const session = await stripe.checkout.sessions.retrieve(session_id)

  if (session.payment_status !== 'paid') {
    const checkoutId = session.metadata?.checkoutId
    if (checkoutId) await cancelPendingCheckoutService({ checkoutId, userId })
    return { success: false, message: 'Payment not completed' }
  }

  const existingOrder = await orderModel.findOne({ stripeSessionId: session_id })
  const existingWaitingOrder = await waitForApproveModel.findOne({ stripeSessionId: session_id })

  if (existingOrder || existingWaitingOrder) return { success: true, message: 'Order already placed' }

  const checkoutId = session.metadata.checkoutId
  const pendingCheckout = await getPendingCheckoutService(checkoutId)

  if (!pendingCheckout) return { success: false, message: 'Checkout not found' }

  const orderError = isInvalidOrder(pendingCheckout.items, pendingCheckout.amount, pendingCheckout.address)

  if (orderError) {
    await deletePendingCheckoutService(checkoutId, true)
    return { success: false, message: orderError }
  }

  const stockError = pendingCheckout.stockReserved ? null : await reserveInventoryStock(pendingCheckout.items)

  if (stockError) {
    await deletePendingCheckoutService(checkoutId, true)
    return { success: false, message: `${stockError} Please contact support for payment assistance.` }
  }

  let waitingOrder

  try {
    waitingOrder = await createWaitingOrderService({ userId: pendingCheckout.userId, items: pendingCheckout.items, subtotal: pendingCheckout.subtotal, membershipRank: pendingCheckout.membershipRank, discountPercent: pendingCheckout.discountPercent, discountAmount: pendingCheckout.discountAmount, deliveryFee: pendingCheckout.deliveryFee, address: pendingCheckout.address, amount: pendingCheckout.amount, paymentMethod: 'Stripe', payment: true, stockReserved: true, stripeSessionId: session_id, date: Date.now() })
  } catch (error) {
    await releaseInventoryStock(pendingCheckout.items)
    throw error
  }

  const notification = await createNotificationService({ userId: pendingCheckout.userId, orderId: waitingOrder._id.toString(), items: waitingOrder.items, type: 'pending', title: 'Order awaiting approval', message: 'Your payment was successful. Your order is waiting for admin approval.' })
  await userModel.findByIdAndUpdate(pendingCheckout.userId, { cartData: {} })
  await cartModel.deleteMany({ userId: pendingCheckout.userId })
  await deletePendingCheckoutService(checkoutId)

  return { success: true, message: 'Order waiting for approve', notification }
}

const placeOrderMomoService = async ({ userId, items, amount, address }) => {
  const orderError = isInvalidOrder(items, amount, address)
  if (orderError) return { success: false, message: orderError }

  const pricing = await calculateMemberOrderService(userId, items)
  await cleanupExpiredCheckoutsService()
  const stockError = await reserveInventoryStock(pricing.items)
  if (stockError) return { success: false, message: stockError }

  let pendingCheckout

  try {
    pendingCheckout = await createPendingCheckoutService({ userId, ...pricing, address, paymentMethod: 'MoMo', stockReserved: true })
  } catch (error) {
    await releaseInventoryStock(pricing.items)
    throw error
  }

  return { success: true, checkoutId: pendingCheckout._id }
}

const verifyMomoService = async ({ checkoutId, phone, otp }) => {
  const phoneRegex = /^[0-9]{10}$/
  const otpRegex = /^[0-9]{6}$/

  if (!phoneRegex.test(phone)) return { success: false, message: 'Phone number must be exactly 10 digits' }
  if (!otpRegex.test(otp)) return { success: false, message: 'OTP must be exactly 6 digits' }

  const pendingCheckout = await getPendingCheckoutService(checkoutId)

  if (!pendingCheckout) return { success: false, message: 'Checkout not found' }

  const orderError = isInvalidOrder(pendingCheckout.items, pendingCheckout.amount, pendingCheckout.address)

  if (orderError) {
    await deletePendingCheckoutService(checkoutId, true)
    return { success: false, message: orderError }
  }

  const stockError = pendingCheckout.stockReserved ? null : await reserveInventoryStock(pendingCheckout.items)

  if (stockError) {
    await deletePendingCheckoutService(checkoutId, true)
    return { success: false, message: stockError }
  }

  let waitingOrder

  try {
    waitingOrder = await createWaitingOrderService({ userId: pendingCheckout.userId, items: pendingCheckout.items, subtotal: pendingCheckout.subtotal, membershipRank: pendingCheckout.membershipRank, discountPercent: pendingCheckout.discountPercent, discountAmount: pendingCheckout.discountAmount, deliveryFee: pendingCheckout.deliveryFee, address: pendingCheckout.address, amount: pendingCheckout.amount, paymentMethod: 'MoMo', payment: true, stockReserved: true, date: Date.now() })
  } catch (error) {
    await releaseInventoryStock(pendingCheckout.items)
    throw error
  }

  const notification = await createNotificationService({ userId: pendingCheckout.userId, orderId: waitingOrder._id.toString(), items: waitingOrder.items, type: 'pending', title: 'Order awaiting approval', message: 'Your payment was successful. Your order is waiting for admin approval.' })
  await userModel.findByIdAndUpdate(pendingCheckout.userId, { cartData: {} })
  await cartModel.deleteMany({ userId: pendingCheckout.userId })
  await deletePendingCheckoutService(checkoutId)

  return { success: true, message: 'Order waiting for approve', notification }
}

const allOrdersService = async () => {
  const orders = await orderModel.find({}).sort({ date: -1, _id: -1 }).lean()
  const userIds = [...new Set(orders.map((order) => order.userId).filter(Boolean))]
  const [users, admins] = await Promise.all([
    userModel.find({ _id: { $in: userIds } }).select('name email avatar').lean(),
    adminModel.find({}).select('name').lean()
  ])
  const userMap = new Map(users.map((user) => [String(user._id), user]))
  const adminMap = new Map(admins.map((admin) => [String(admin._id), admin.name]))
  const defaultAdminName = admins.length === 1 ? admins[0].name : 'Admin'

  return {
    success: true,
    orders: orders.map((order) => ({
      ...order,
      customer: userMap.get(String(order.userId)) || null,
      approvedByAdmin: adminMap.get(String(order.approvedByAdminId)) || order.approvedByAdmin || defaultAdminName
    }))
  }
}

const userOrdersService = async ({ userId }) => {
  const [orders, waitingOrders, rejectedOrders] = await Promise.all([
    orderModel.find({ userId }),
    waitForApproveModel.find({ userId }),
    rejectedOrderModel.find({ userId })
  ])

  const userOrderList = [
    ...orders.map(order => publicOrder(order, 'approved')),
    ...waitingOrders.map(order => publicOrder(order, 'waiting')),
    ...rejectedOrders.map(order => publicOrder(order, 'rejected'))
  ].sort((a, b) => Number(a.date || 0) - Number(b.date || 0))

  return { success: true, orders: userOrderList }
}

const singleOrderService = async ({ userId, orderId }) => {
  let order = await orderModel.findOne({ _id: orderId, userId })
  let approvalStatus = 'approved'

  if (!order) {
    order = await waitForApproveModel.findOne({ _id: orderId, userId })
    approvalStatus = 'waiting'
  }

  if (!order) {
    order = await rejectedOrderModel.findOne({ _id: orderId, userId })
    approvalStatus = 'rejected'
  }

  if (!order) return { success: false, message: 'Order not found' }

  return { success: true, order: publicOrder(order, approvalStatus) }
}

const cancelOrderService = async ({ userId, orderId }) => {
  const waitingOrder = await waitForApproveModel.findOneAndUpdate(
    { _id: orderId, userId, status: 'Wait For Approve' },
    { $set: { status: 'Canceling' } },
    { new: true }
  )

  if (waitingOrder) {
    if (waitingOrder.stockReserved) await releaseInventoryStock(waitingOrder.items)
    await waitForApproveModel.findOneAndDelete({ _id: orderId, userId })
    return { success: true, message: 'Order canceled successfully' }
  }

  const order = await orderModel.findOne({ _id: orderId, userId })

  if (!order) return { success: false, message: 'Order not found' }
  if (!canCancelOrder(order.status)) return { success: false, message: 'This order cannot be canceled anymore' }

  await releaseInventoryStock(order.items)
  await orderModel.findOneAndDelete({ _id: orderId, userId })

  return { success: true, message: 'Order canceled successfully' }
}

const updateStatusService = async ({ orderId, status }) => {
  const orderData = status === 'Delivered' ? { status, payment: true } : { status }
  const order = await orderModel.findByIdAndUpdate(orderId, orderData, { new: true })
  if (!order) return { success: false, message: 'Order not found' }

  const notification = await createNotificationService({ userId: order.userId, orderId: order._id.toString(), items: order.items, type: 'status', title: 'Order status updated', message: `Your order has moved to ${status}.`, status })
  return { success: true, message: 'Status Updated', notification }
}

export { placeOrderService, placeOrderStripeService, verifyStripeService, placeOrderMomoService, verifyMomoService, allOrdersService, userOrdersService, singleOrderService, cancelOrderService, updateStatusService }
