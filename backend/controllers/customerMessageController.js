import { sendCustomerMessageService, getAllCustomerMessagesService, startCustomerMessageService, replyCustomerMessageService, getCustomerMessageService, deleteClientMessageService, deleteAdminMessageService, deleteConversationService } from '../services/customerMessageService.js'

const emitChatUpdate = (req, result, sender) => {
  if (!result.success || !result.chat) return

  const io = req.app.get('io')
  io.to('admins').to(`user:${result.chat.userId}`).emit('customer-message:update', { chat: result.chat, sender })
}

const sendCustomerMessage = async (req, res) => {
  try {
    const result = await sendCustomerMessageService(req.body)
    emitChatUpdate(req, result, 'client')
    res.json(result)
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const getAllCustomerMessages = async (req, res) => {
  try {
    res.json(await getAllCustomerMessagesService())
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const startCustomerMessage = async (req, res) => {
  try {
    res.json(await startCustomerMessageService(req.body))
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const replyCustomerMessage = async (req, res) => {
  try {
    const result = await replyCustomerMessageService(req.body)
    emitChatUpdate(req, result, 'admin')
    res.json(result)
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const getCustomerMessage = async (req, res) => {
  try {
    res.json(await getCustomerMessageService(req.body))
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const deleteClientMessage = async (req, res) => {
  try {
    const result = await deleteClientMessageService(req.body)
    emitChatUpdate(req, result)
    res.json(result)
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const deleteAdminMessage = async (req, res) => {
  try {
    const result = await deleteAdminMessageService(req.body)
    emitChatUpdate(req, result)
    res.json(result)
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const deleteConversation = async (req, res) => {
  try {
    res.json(await deleteConversationService(req.body))
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

export { sendCustomerMessage, getAllCustomerMessages, startCustomerMessage, replyCustomerMessage, getCustomerMessage, deleteClientMessage, deleteAdminMessage, deleteConversation }
