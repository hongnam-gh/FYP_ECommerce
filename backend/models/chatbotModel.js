import mongoose from 'mongoose'

const chatbotSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  messages: [
    {
      sender: { type: String, enum: ['customer', 'chatbot'], required: true },
      text: { type: String, required: true },
      date: { type: Number, required: true }
    }
  ],
  date: { type: Number, required: true }
})

const chatbotModel = mongoose.models.chatbot || mongoose.model('chatbot', chatbotSchema)

export default chatbotModel
