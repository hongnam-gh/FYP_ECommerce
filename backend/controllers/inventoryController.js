import { listInventoryService, singleInventoryService, updateInventoryService } from '../services/inventoryService.js'

const listInventory = async (req, res) => {
  try {
    res.json(await listInventoryService())
  } catch (error) {
    console.error(error)
    res.json({ success: false, message: error.message })
  }
}

const singleInventory = async (req, res) => {
  try {
    res.json(await singleInventoryService(req.body.productId))
  } catch (error) {
    console.error(error)
    res.json({ success: false, message: error.message })
  }
}

const updateInventory = async (req, res) => {
  try {
    res.json(await updateInventoryService(req.body.productId, req.body.stock))
  } catch (error) {
    console.error(error)
    res.json({ success: false, message: error.message })
  }
}

export { listInventory, singleInventory, updateInventory }
