import mongoose from 'mongoose'

const materialSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  date: { type: Number, default: Date.now }
})

const materialModel = mongoose.models.material || mongoose.model('material', materialSchema)

export default materialModel
