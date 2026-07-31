import orderModel from '../models/orderModel.js'
import userModel from '../models/userModel.js'
import waitForApproveModel from '../models/waitForApproveModel.js'
import { sendOrderConfirmationEmail } from './emailService.js'
import { createNotificationService } from './notificationService.js'
import { reserveInventoryStock, releaseInventoryStock } from './inventoryStockService.js'

// ------ Public Services --------

const createWaitingOrderService = async (orderData) => {
  const newOrder = new waitForApproveModel(orderData)
  await newOrder.save()
  return newOrder
}

const waitForApproveOrdersService = async () => {
  const orders = await waitForApproveModel.find({}).sort({ date: -1, _id: -1 }).lean()
  const userIds = [...new Set(orders.map((order) => order.userId).filter(Boolean))]
  const users = await userModel.find({ _id: { $in: userIds } }).select('name email avatar').lean()
  const userMap = new Map(users.map((user) => [String(user._id), user]))

  return {
    success: true,
    orders: orders.map((order) => ({ ...order, customer: userMap.get(String(order.userId)) || null }))
  }
}

const approveOrderService = async ({ orderId, adminId, adminName }) => {
  const waitingOrder = await waitForApproveModel.findOneAndUpdate(
    { _id: orderId, status: 'Wait For Approve' },
    { $set: { status: 'Approving' } },
    { new: true }
  )

  if (!waitingOrder) return { success: false, message: 'Waiting order not found' }

  const stockError = waitingOrder.stockReserved ? null : await reserveInventoryStock(waitingOrder.items)
  if (stockError) {
    await waitForApproveModel.findByIdAndUpdate(orderId, { status: 'Wait For Approve' })
    return { success: false, message: stockError }
  }

  if (!waitingOrder.stockReserved) {
    waitingOrder.stockReserved = true

    try {
      await waitingOrder.save()
    } catch (error) {
      await releaseInventoryStock(waitingOrder.items)
      await waitForApproveModel.findByIdAndUpdate(orderId, { status: 'Wait For Approve', stockReserved: false })
      throw error
    }
  }

  const orderData = {
    userId: waitingOrder.userId,
    items: waitingOrder.items,
    address: waitingOrder.address,
    subtotal: waitingOrder.subtotal,
    membershipRank: waitingOrder.membershipRank,
    discountPercent: waitingOrder.discountPercent,
    discountAmount: waitingOrder.discountAmount,
    deliveryFee: waitingOrder.deliveryFee,
    amount: waitingOrder.amount,
    paymentMethod: waitingOrder.paymentMethod,
    payment: waitingOrder.payment,
    stripeSessionId: waitingOrder.stripeSessionId,
    approvedByAdminId: adminId,
    approvedByAdmin: adminName || 'Admin',
    approvedAt: Date.now(),
    date: waitingOrder.date
  }

  const newOrder = new orderModel(orderData)

  try {
    await newOrder.save()
  } catch (error) {
    await waitForApproveModel.findByIdAndUpdate(orderId, { status: 'Wait For Approve' })
    throw error
  }

  await waitForApproveModel.findByIdAndDelete(orderId)

  sendOrderConfirmationEmail(newOrder).catch(error => console.log(error))

  const notification = await createNotificationService({ userId: newOrder.userId, orderId: newOrder._id.toString(), items: newOrder.items, type: 'approved', title: 'Order approved', message: 'Your order has been approved and is now being prepared.' })

  return { success: true, message: 'Order approved', notification }
}

export { createWaitingOrderService, waitForApproveOrdersService, approveOrderService }
