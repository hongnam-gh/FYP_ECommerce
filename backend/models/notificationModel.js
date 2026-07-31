import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  orderId: { type: String, default: '' },
  productId: { type: String, default: '' },
  productImage: { type: String, default: '' },
  type: { type: String, enum: ['pending', 'approved', 'rejected', 'status', 'product'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, default: '' },
  read: { type: Boolean, default: false },
  date: { type: Number, required: true }
})

const notificationModel = mongoose.models.notification || mongoose.model('notification', notificationSchema)

export default notificationModel
