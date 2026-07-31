import mongoose from 'mongoose'

const chatSchema = new mongoose.Schema({
  userId: { type: String, default: '' },
  name: { type: String, required: true },
  email: { type: String, required: true },
  messages: [
    {
      sender: { type: String, required: true },
      text: { type: String, required: true },
      date: { type: Number, required: true }
    }
  ],
  status: { type: String, default: 'open' },
  date: { type: Number, required: true }
})

const chatModel = mongoose.models.chat || mongoose.model('chat', chatSchema)

export default chatModel