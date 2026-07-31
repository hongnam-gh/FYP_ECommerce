import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  date: { type: Number, default: Date.now }
})

const categoryModel = mongoose.models.category || mongoose.model('category', categorySchema)

export default categoryModel