import mongoose from "mongoose";

const pendingCheckoutSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  items: { type: Array, required: true },
  subtotal: { type: Number, default: 0 },
  membershipRank: { type: String, default: 'Standard' },
  discountPercent: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 10 },
  amount: { type: Number, required: true },
  address: { type: Object, required: true },
  paymentMethod: { type: String, enum: ['Stripe', 'MoMo'], required: true },
  stockReserved: { type: Boolean, default: false },
  expiresAt: { type: Number, required: true },
  date: { type: Number, required: true },
});

const pendingCheckoutModel =
  mongoose.models.pendingCheckout ||
  mongoose.model("pendingCheckout", pendingCheckoutSchema);

export default pendingCheckoutModel;
