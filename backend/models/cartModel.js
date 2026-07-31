import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, default: "" },
    subCategory: { type: String, default: "" },
    size: { type: String, required: true },
    quantity: { type: Number, required: true },
    date: { type: Number, required: true },
}, { minimize: false })

cartSchema.index({ userId: 1, productId: 1, size: 1 }, { unique: true })

const cartModel = mongoose.models.cart || mongoose.model('cart', cartSchema, 'cart')

export default cartModel
