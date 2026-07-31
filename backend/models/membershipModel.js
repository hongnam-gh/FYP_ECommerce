import mongoose from 'mongoose'

const membershipSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true, unique: true },
  rank: { type: String, enum: ['Standard', 'Silver', 'Gold', 'Diamond'], default: 'Standard' },
  totalSpent: { type: Number, default: 0 },
  rankHistory: {
    type: [{ rank: { type: String, required: true }, date: { type: Number, required: true } }],
    default: () => [{ rank: 'Standard', date: Date.now() }]
  },
  lastCalculatedAt: { type: Number, default: Date.now }
})

const membershipModel = mongoose.models.membership || mongoose.model('membership', membershipSchema)

export default membershipModel
