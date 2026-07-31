import inventoryModel from '../models/inventoryModel.js'
import productModel from '../models/productModel.js'

// ------ Business Helpers --------

const validateStock = (stock = {}) => {
  const cleanStock = {}

  for (const size in stock) {
    const value = stock[size]
    if (!/^\d+$/.test(String(value).trim())) throw new Error('Stock must be a whole number')

    cleanStock[size] = Number(value)
  }

  return cleanStock
}

// ------ Public Services --------

const listInventoryService = async () => {
  const products = await productModel.find({}).lean()

  await Promise.all(products.map(async (product) => {
    const existingInventory = await inventoryModel.findOne({ productId: product._id })
    if (!existingInventory) {
      const stock = product.sizes.reduce((stockData, size) => ({ ...stockData, [size]: 0 }), {})
      await inventoryModel.create({ productId: product._id, stock })
    }
  }))

  const inventories = await inventoryModel.find({}).lean()

  const hydratedInventories = await Promise.all(inventories.map(async (item) => {
    const product = await productModel.findById(item.productId).lean()
    return { ...item, product }
  }))

  return { success: true, inventories: hydratedInventories }
}

const singleInventoryService = async (productId) => {
  const inventory = await inventoryModel.findOne({ productId })
  return { success: true, inventory }
}

const updateInventoryService = async (productId, stock) => {
  const inventory = await inventoryModel.findOne({ productId })
  if (!inventory) throw new Error('Inventory not found')

  inventory.stock = validateStock(stock)
  await inventory.save()

  return { success: true, message: 'Inventory updated', inventory }
}

export { listInventoryService, singleInventoryService, updateInventoryService }
