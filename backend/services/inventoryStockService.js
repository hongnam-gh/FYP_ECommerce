import inventoryModel from '../models/inventoryModel.js'

// ------ Public Services --------

const releaseInventoryStock = async (items) => {
  for (const item of items) {
    const productId = item._id || item.productId
    const size = item.size
    const quantity = Number(item.quantity || 0)

    if (!productId || !size || quantity <= 0) continue

    await inventoryModel.findOneAndUpdate({ productId }, { $inc: { [`stock.${size}`]: quantity } })
  }
}

const reserveInventoryStock = async (items) => {
  const reservedItems = []

  for (const item of items) {
    const productId = item._id || item.productId
    const size = item.size
    const quantity = Number(item.quantity || 0)

    if (!productId || !size || quantity <= 0) {
      await releaseInventoryStock(reservedItems)
      return 'Invalid product size or quantity'
    }

    const inventory = await inventoryModel.findOneAndUpdate({ productId, [`stock.${size}`]: { $gte: quantity } }, { $inc: { [`stock.${size}`]: -quantity } }, { new: true })

    if (!inventory) {
      await releaseInventoryStock(reservedItems)
      return 'Insufficient stock for the selected size.'
    }

    reservedItems.push({ productId, size, quantity })
  }

  return null
}

export { reserveInventoryStock, releaseInventoryStock }
