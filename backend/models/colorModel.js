import mongoose from 'mongoose'

const colorSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  date: { type: Number, default: Date.now }
})

const colorModel = mongoose.models.color || mongoose.model('color', colorSchema)

export default colorModel
