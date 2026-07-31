import { getChatbotHistoryService, chatbotReplyService, deleteChatbotMessageService } from '../services/chatbotService.js'

const getChatbotHistory = async (req, res) => {
  try {
    res.json(await getChatbotHistoryService(req.body.userId))
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const replyChatbot = async (req, res) => {
  try {
    res.json(await chatbotReplyService(req.body))
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const deleteChatbotMessage = async (req, res) => {
  try {
    res.json(await deleteChatbotMessageService(req.body))
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

export { getChatbotHistory, replyChatbot, deleteChatbotMessage }
