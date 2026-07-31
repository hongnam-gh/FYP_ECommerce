import mongoose from 'mongoose'

const bannerSchema = new mongoose.Schema({
  page: { type: String, required: true, unique: true },
  image: { type: String, required: true },
  eyebrow: { type: String, default: '' },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  date: { type: Number, default: Date.now }
})

const bannerModel = mongoose.models.banner || mongoose.model('banner', bannerSchema)

export default bannerModel
