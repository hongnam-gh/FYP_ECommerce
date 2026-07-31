import chatModel from '../models/chatModel.js'
import userModel from '../models/userModel.js'

// ------ Business Helpers --------

const isDuplicateMessage = (lastMessage, sender, text) => {
  return lastMessage && lastMessage.sender === sender && lastMessage.text === text && Date.now() - lastMessage.date < 1500
}

// ------ Public Services --------

const sendCustomerMessageService = async ({ userId, name, email, text }) => {
  if (!name || !email || !text) return { success: false, message: 'Missing chat information' }

  let chat = await chatModel.findOne({ email, status: 'open' })

  if (chat) {
    const lastMessage = chat.messages[chat.messages.length - 1]

    if (!isDuplicateMessage(lastMessage, 'client', text)) {
      chat.messages.push({ sender: 'client', text, date: Date.now() })
      await chat.save()
    }
  } else {
    chat = await chatModel.create({ userId: userId || '', name, email, messages: [{ sender: 'client', text, date: Date.now() }], date: Date.now() })
  }

  return { success: true, message: 'Chat sent', chat }
}

const getAllCustomerMessagesService = async () => {
  const chats = await chatModel.find({}).sort({ date: -1 })
  return { success: true, chats }
}

const startCustomerMessageService = async ({ userId }) => {
  if (!userId) return { success: false, message: 'User is required' }

  const user = await userModel.findById(userId).select('name email')
  if (!user) return { success: false, message: 'User not found' }

  let chat = await chatModel.findOne({ status: 'open', $or: [{ userId: String(user._id) }, { email: user.email }] })

  if (!chat) {
    chat = await chatModel.create({ userId: String(user._id), name: user.name, email: user.email, messages: [], date: Date.now() })
  } else {
    chat.userId = String(user._id)
    chat.name = user.name
    chat.email = user.email
    await chat.save()
  }

  return { success: true, message: 'Conversation ready', chat }
}

const replyCustomerMessageService = async ({ chatId, text }) => {
  if (!chatId || !text) return { success: false, message: 'Missing reply information' }

  const chat = await chatModel.findById(chatId)
  if (!chat) return { success: false, message: 'Chat not found' }

  const lastMessage = chat.messages[chat.messages.length - 1]

  if (!isDuplicateMessage(lastMessage, 'admin', text)) {
    chat.messages.push({ sender: 'admin', text, date: Date.now() })
    await chat.save()
  }

  return { success: true, message: 'Reply sent', chat }
}

const getCustomerMessageService = async ({ email }) => {
  if (!email) return { success: false, message: 'Email is required' }

  const chat = await chatModel.findOne({ email, status: 'open' })
  return { success: true, chat }
}

const deleteClientMessageService = async ({ chatId, messageId, email }) => {
  if (!chatId || !messageId || !email) return { success: false, message: 'Missing delete information' }

  const chat = await chatModel.findOne({ _id: chatId, email, status: 'open' })
  if (!chat) return { success: false, message: 'Chat not found' }

  const message = chat.messages.id(messageId)
  if (!message) return { success: false, message: 'Message not found' }
  if (message.sender !== 'client') return { success: false, message: 'You can only delete your own messages' }

  chat.messages.pull({ _id: messageId })
  await chat.save()

  return { success: true, message: 'Message deleted', chat }
}

const deleteAdminMessageService = async ({ chatId, messageId }) => {
  if (!chatId || !messageId) return { success: false, message: 'Missing delete information' }

  const chat = await chatModel.findById(chatId)
  if (!chat) return { success: false, message: 'Chat not found' }

  const message = chat.messages.id(messageId)
  if (!message) return { success: false, message: 'Message not found' }
  if (message.sender !== 'admin') return { success: false, message: 'Admin can only delete admin messages' }

  chat.messages.pull({ _id: messageId })
  await chat.save()

  return { success: true, message: 'Message deleted', chat }
}

const deleteConversationService = async ({ chatId }) => {
  if (!chatId) return { success: false, message: 'Conversation is required' }

  const chat = await chatModel.findByIdAndDelete(chatId)
  if (!chat) return { success: false, message: 'Conversation not found' }

  return { success: true, message: 'Conversation deleted', chatId }
}

export { sendCustomerMessageService, getAllCustomerMessagesService, startCustomerMessageService, replyCustomerMessageService, getCustomerMessageService, deleteClientMessageService, deleteAdminMessageService, deleteConversationService }
