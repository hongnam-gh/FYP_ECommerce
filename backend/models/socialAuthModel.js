import mongoose from "mongoose";

const socialAuthSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    provider: { type: String, enum: ['google', 'facebook'], required: true },
    providerId: { type: String, required: true },
    email: { type: String, required: true },
    avatar: { type: String, default: '' },
}, { minimize: false })

socialAuthSchema.index({ provider: 1, providerId: 1 }, { unique: true })
socialAuthSchema.index({ userId: 1, provider: 1 }, { unique: true })

const socialAuthModel = mongoose.models.socialAuth || mongoose.model('socialAuth', socialAuthSchema)

export default socialAuthModel
