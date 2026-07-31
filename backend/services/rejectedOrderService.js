import waitForApproveModel from '../models/waitForApproveModel.js'
import rejectedOrderModel from '../models/rejectedOrderModel.js'
import { createNotificationService } from './notificationService.js'
import { releaseInventoryStock } from './inventoryStockService.js'

// ------ Public Services --------

const rejectOrderService = async ({ orderId, reason }) => {
  const rejectReason = String(reason || '').trim()

  if (!rejectReason) return { success: false, message: 'Reject reason is required' }

  const waitingOrder = await waitForApproveModel.findOneAndUpdate(
    { _id: orderId, status: 'Wait For Approve' },
    { $set: { status: 'Rejecting' } },
    { new: true }
  )

  if (!waitingOrder) return { success: false, message: 'Waiting order not found' }

  let rejectedOrder

  try {
    rejectedOrder = await rejectedOrderModel.create({
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
      rejectReason,
      rejectedAt: Date.now(),
      date: waitingOrder.date
    })
  } catch (error) {
    await waitForApproveModel.findByIdAndUpdate(orderId, { status: 'Wait For Approve' })
    throw error
  }

  if (waitingOrder.stockReserved) await releaseInventoryStock(waitingOrder.items)
  await waitForApproveModel.findByIdAndDelete(orderId)

  const notification = await createNotificationService({ userId: rejectedOrder.userId, orderId: rejectedOrder._id.toString(), items: rejectedOrder.items, type: 'rejected', title: 'Order rejected', message: `Your order was rejected. Reason: ${rejectReason}` })

  return { success: true, message: 'Order rejected', notification }
}

const rejectedOrdersService = async () => {
  const orders = await rejectedOrderModel.find({})
  return { success: true, orders }
}

export { rejectOrderService, rejectedOrdersService }
