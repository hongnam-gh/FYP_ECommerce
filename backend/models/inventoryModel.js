import mongoose from 'mongoose'

const inventorySchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'product', required: true, unique: true },
  stock: { type: Object, default: {} }
})

const inventoryModel = mongoose.models.inventory || mongoose.model('inventory', inventorySchema)

export default inventoryModel