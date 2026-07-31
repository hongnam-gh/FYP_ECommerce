import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  code: { type: String, required: true, unique: true, trim: true, match: [/^[A-Z0-9]+$/, 'Product code can only contain uppercase letters and numbers'] },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: Array, required: true },
  category: { type: String, required: true },
  subCategory: { type: String, required: true },
  material: { type: [String], default: [] },
  color: { type: [String], default: [] },
  sizes: { type: Array, required: true, validate: { validator: (value) => value.length > 0, message: 'Product size is required' } },
  newarrival: { type: Boolean },
  date: { type: Number, required: true },
})

const productModel = mongoose.models.product || mongoose.model('product', productSchema)

export default productModel
