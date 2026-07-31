import mongoose from "mongoose";

const rejectedOrderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  items: { type: Array, required: true },
  subtotal: { type: Number, default: 0 },
  membershipRank: { type: String, default: 'Standard' },
  discountPercent: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 10 },
  amount: { type: Number, required: true },
  address: { type: Object, required: true },
  status: { type: String, required: true, default: 'Rejected' },
  paymentMethod: { type: String, required: true },
  payment: { type: Boolean, required: true, default: false },
  stripeSessionId: { type: String },
  rejectReason: { type: String, required: true },
  rejectedAt: { type: Number, required: true },
  date: { type: Number, required: true }
})

const rejectedOrderModel = mongoose.models.rejectedOrder || mongoose.model("rejectedOrder", rejectedOrderSchema)

export default rejectedOrderModel
