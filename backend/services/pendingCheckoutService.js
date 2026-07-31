import pendingCheckoutModel from '../models/pendingCheckoutModel.js'
import { releaseInventoryStock } from './inventoryStockService.js'

// ------ Config --------

const checkoutDuration = 35 * 60 * 1000

// ------ Public Services --------

const cleanupExpiredCheckoutsService = async () => {
  const expiredCheckouts = await pendingCheckoutModel.find({ expiresAt: { $lte: Date.now() } })

  for (const checkout of expiredCheckouts) {
    const deletedCheckout = await pendingCheckoutModel.findOneAndDelete({ _id: checkout._id, expiresAt: { $lte: Date.now() } })
    if (deletedCheckout?.stockReserved) await releaseInventoryStock(deletedCheckout.items)
  }
}

const createPendingCheckoutService = async (checkoutData) => {
  await cleanupExpiredCheckoutsService()
  const date = Date.now()
  return await pendingCheckoutModel.create({ ...checkoutData, date, expiresAt: date + checkoutDuration })
}

const getPendingCheckoutService = async (checkoutId) => {
  if (!checkoutId) return null
  return await pendingCheckoutModel.findById(checkoutId)
}

const deletePendingCheckoutService = async (checkoutId, releaseStock = false) => {
  if (!checkoutId) return null
  const pendingCheckout = await pendingCheckoutModel.findByIdAndDelete(checkoutId)
  if (releaseStock && pendingCheckout?.stockReserved) await releaseInventoryStock(pendingCheckout.items)
  return pendingCheckout
}

const cancelPendingCheckoutService = async ({ userId, checkoutId }) => {
  if (!userId || !checkoutId) return { success: false, message: 'Checkout not found' }

  const pendingCheckout = await pendingCheckoutModel.findOneAndDelete({ _id: checkoutId, userId })
  if (!pendingCheckout) return { success: false, message: 'Checkout not found' }

  if (pendingCheckout.stockReserved) await releaseInventoryStock(pendingCheckout.items)

  return { success: true, message: 'Pending checkout deleted' }
}

export { createPendingCheckoutService, getPendingCheckoutService, deletePendingCheckoutService, cancelPendingCheckoutService, cleanupExpiredCheckoutsService }
