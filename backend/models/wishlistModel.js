import mongoose from 'mongoose'

const wishlistSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  productId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, default: '' },
  subCategory: { type: String, default: '' },
  date: { type: Number, required: true }
}, { minimize: false })

wishlistSchema.index({ userId: 1, productId: 1 }, { unique: true })

const wishlistModel = mongoose.models.wishlist || mongoose.model('wishlist', wishlistSchema, 'wishlist')

export default wishlistModel
