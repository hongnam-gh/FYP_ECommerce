import mongoose from 'mongoose'

const collectionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  path: { type: String, required: true },
  image: { type: String, required: true },
  gender: { type: String, enum: ['Men', 'Women', 'Unisex'], default: 'Unisex' },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'product' }],
  date: { type: Number, default: Date.now }
})

const collectionModel = mongoose.models.collection || mongoose.model('collection', collectionSchema)

export default collectionModel
