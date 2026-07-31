import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  items: { type: Array, required: true },
  subtotal: { type: Number, default: 0 },
  membershipRank: { type: String, default: 'Standard' },
  discountPercent: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 10 },
  amount: { type: Number, required: true },
  address: { type: Object, required: true },
  status: { type: String, required: true, default: 'Order Placed' },
  paymentMethod: { type: String, required: true },
  payment: { type: Boolean, required: true, default: false },
  stripeSessionId: { type: String },
  approvedByAdminId: { type: String, default: '' },
  approvedByAdmin: { type: String, default: '' },
  approvedAt: { type: Number, default: 0 },
  date: { type: Number, required: true }
})

const orderModel = mongoose.models.order || mongoose.model("order", orderSchema)

export default orderModel
