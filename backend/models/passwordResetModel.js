import mongoose from 'mongoose'

const passwordResetSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    email: { type: String, required: true },
    token: { type: String, required: true },
    expiresAt: { type: Number, required: true },
    used: { type: Boolean, default: false },
    date: { type: Number, required: true }
})

const passwordResetModel = mongoose.models.passwordreset || mongoose.model('passwordreset', passwordResetSchema)

export default passwordResetModel