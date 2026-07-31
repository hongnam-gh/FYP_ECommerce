import mongoose from "mongoose";

const waitForApproveSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  items: { type: Array, required: true },
  subtotal: { type: Number, default: 0 },
  membershipRank: { type: String, default: 'Standard' },
  discountPercent: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 10 },
  amount: { type: Number, required: true },
  address: { type: Object, required: true },
  status: { type: String, required: true, default: 'Wait For Approve' },
  paymentMethod: { type: String, required: true },
  payment: { type: Boolean, required: true, default: false },
  stockReserved: { type: Boolean, default: false },
  stripeSessionId: { type: String },
  date: { type: Number, required: true }
})

const waitForApproveModel = mongoose.models.waitForApprove || mongoose.model("waitForApprove", waitForApproveSchema)

export default waitForApproveModel
