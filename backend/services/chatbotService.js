import chatbotModel from '../models/chatbotModel.js'
import productModel from '../models/productModel.js'
import { getSizeRecommendation } from './sizeSuggestionService.js'

// ------ Config --------

const PRODUCT_DETAILS_PROMPT = 'Please provide the product code, your height (cm), and your weight (kg).'
const FIT_PROMPT = 'Would you like Slim Fit, Regular Fit, or Oversized Fit?'

// ------ Business Helpers --------

const isStoreOnlyRefusal = (text = '') => {
  return /can only help with questions about (?:using )?the Distressed store|unable to provide information about individuals|can't help with that question/i.test(text)
}

const isProductAdviceRequest = (text) => {
  return /recommend(?:ation)?|advice|consult|\bsize\b/i.test(text)
}

const getConsultationState = (messages) => {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (message.sender !== 'chatbot') continue
    if (/contact Admin Support/i.test(message.text)) return ''
    if (message.text === FIT_PROMPT) return 'fit'
    if (/product code|height \(cm\)|weight \(kg\)/i.test(message.text)) return 'details'
  }

  return ''
}

const isProductDetailReply = (text) => {
  return /\d{1,4}\s*(?:cm|kg)|\b(?=[a-z0-9]*[a-z])(?=[a-z0-9]*\d)[a-z0-9]{2,30}\b/i.test(text)
}

const isFitReply = (text) => {
  return /\bslim(?: fit)?\b|\bregular(?: fit)?\b|\boversized?(?: fit)?\b/i.test(text)
}

const getInvalidMeasurement = (text) => {
  const heightMatches = [...text.matchAll(/\b(\d{1,4})\s*(?:cm|centimeters?|centimetres?)/gi)]
  const weightMatches = [...text.matchAll(/\b(\d{1,4})\s*(?:kg|kilograms?|kilogrammes?)/gi)]
  const height = Number(heightMatches[heightMatches.length - 1]?.[1])
  const weight = Number(weightMatches[weightMatches.length - 1]?.[1])

  if (height && (height < 120 || height > 220)) return 'height'
  if (weight && (weight < 30 || weight > 200)) return 'weight'

  return ''
}

const hasMeasurements = (text) => {
  const hasHeight = /(\d{3})\s*(?:cm|centimeters?|centimetres?)/i.test(text)
  const hasWeight = /(\d{2,3})\s*(?:kg|kilograms?|kilogrammes?)/i.test(text)
  return hasHeight && hasWeight
}

const getProductFromMessages = async (messages) => {
  const customerMessages = messages.filter((message) => message.sender === 'customer').reverse()

  for (const message of customerMessages) {
    const codes = (message.text.match(/[a-z0-9]+/gi) || [])
      .map((code) => code.toUpperCase())
      .filter((code) => code.length <= 30 && !/^\d+$/.test(code) && !/^\d+(CM|KG)$/.test(code))

    if (codes.length === 0) continue

    const product = await productModel.findOne({ code: { $in: codes } })
    if (product) return product
  }

  return null
}

const getActiveConsultationMessages = (messages) => {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (message.sender === 'chatbot' && message.text === PRODUCT_DETAILS_PROMPT) {
      return messages.slice(index + 1)
    }
  }

  return messages.slice(-8)
}

const saveChatbotReply = async (chat, text) => {
  chat.messages.push({ sender: 'chatbot', text, date: Date.now() })
  await chat.save()
  return { success: true, reply: text, chat }
}

// ------ Public Services --------

const getChatbotHistoryService = async (userId) => {
  if (!userId) return { success: false, message: 'User not found' }

  const chat = await chatbotModel.findOne({ userId })
  return { success: true, chat }
}

const chatbotReplyService = async ({ userId, text }) => {
  if (!userId || !text?.trim()) return { success: false, message: 'Message is required' }

  let chat = await chatbotModel.findOne({ userId })

  if (chat) {
    chat.messages.push({ sender: 'customer', text: text.trim().slice(0, 1000), date: Date.now() })
  } else {
    chat = await chatbotModel.create({ userId, messages: [{ sender: 'customer', text: text.trim().slice(0, 1000), date: Date.now() }], date: Date.now() })
  }

  if (chat.messages.length > 100) chat.messages = chat.messages.slice(-100)
  await chat.save()

  const previousMessages = chat.messages.slice(0, -1)
  const currentMessage = { sender: 'customer', text }
  const consultationState = getConsultationState(previousMessages)
  const productAdviceRequest = isProductAdviceRequest(text)
  const continueDetails = consultationState === 'details' && isProductDetailReply(text)
  const continueFit = consultationState === 'fit' && isFitReply(text)

  if (continueFit) {
    const activeMessages = getActiveConsultationMessages(previousMessages)
    const product = await getProductFromMessages(activeMessages)
    const sizeRecommendation = getSizeRecommendation(text, product, activeMessages)

    if (sizeRecommendation) return await saveChatbotReply(chat, sizeRecommendation)

    return await saveChatbotReply(chat, PRODUCT_DETAILS_PROMPT)
  }

  if (productAdviceRequest && !isProductDetailReply(text)) {
    return await saveChatbotReply(chat, PRODUCT_DETAILS_PROMPT)
  }

  if (continueDetails || (productAdviceRequest && isProductDetailReply(text))) {
    const activeMessages = getActiveConsultationMessages(previousMessages)
    const consultationMessages = [...activeMessages, currentMessage]
    const product = await getProductFromMessages(consultationMessages)
    const measurementText = consultationMessages.filter((message) => message.sender === 'customer').map((message) => message.text).join(' ')
    const invalidMeasurement = getInvalidMeasurement(measurementText)

    if (invalidMeasurement) {
      const reply = `Sorry, the ${invalidMeasurement} you provided is invalid. Please provide the product code again with a height from 120-220cm and a weight from 30-200kg.`

      return await saveChatbotReply(chat, reply)
    }

    if (!product) {
      return await saveChatbotReply(chat, `Sorry, I could not find that product code. ${PRODUCT_DETAILS_PROMPT}`)
    }

    if (!hasMeasurements(measurementText)) {
      return await saveChatbotReply(chat, `I found ${product.name}. Please provide your height (cm) and weight (kg).`)
    }

    return await saveChatbotReply(chat, FIT_PROMPT)
  }

  if (!process.env.OPENROUTER_API_KEY) return { success: false, message: 'OpenRouter API key is not configured', chat }

  const chatMessages = chat.messages
    .filter((message) => !(message.sender === 'chatbot' && isStoreOnlyRefusal(message.text)))
    .slice(-6)
    .map((message) => ({ role: message.sender === 'customer' ? 'user' : 'assistant', content: message.text }))

  const requestBody = {
    max_tokens: 160,
    temperature: 0.4,
    messages: [
      {
        role: 'system',
	        content: `You are the Distressed assistant. Always reply in English and answer the customer's latest question, even when an earlier product-size flow is unfinished. You can answer both general questions and questions related to the Distressed store. Do not refuse a harmless general question just because it is not about the store. Be direct, natural and helpful in no more than four short sentences without markdown or headings.

Distressed is a fashion ecommerce store. Customers can browse New Arrivals, Women, Men and Accessories; search products from the navbar; view product codes, prices, available sizes, size charts and fit suggestions; use a wishlist and cart; then log in to checkout. Guest cart items merge into the account cart after login. Checkout supports COD, Stripe and MoMo, has a $10 delivery charge, and a submitted order waits for admin approval. Customers can view and track orders, and can cancel only while the order status is Order Placed or Packing. Accounts support signup, login, password reset and up to two saved delivery information cards.

	When the customer asks about Distressed, guide them to the relevant feature or page. For non-store questions, answer normally using general knowledge. Never invent live stock, order, payment or account details. For personal account data, payment problems or a specific order issue, ask the customer to switch to Admin Support.`
      },
      ...chatMessages
    ]
  }

  if (process.env.OPENROUTER_MODEL) requestBody.model = process.env.OPENROUTER_MODEL

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
      'X-OpenRouter-Title': 'Distressed'
    },
    body: JSON.stringify(requestBody),
    signal: controller.signal
  })
    .finally(() => clearTimeout(timeout))

  const data = await response.json()
  if (!response.ok) return { success: false, message: data.error?.message || 'Chatbot is unavailable right now', chat }

  const reply = data.choices?.[0]?.message?.content
  if (!reply || typeof reply !== 'string') return { success: false, message: 'Chatbot did not return a response', chat }

  chat.messages.push({ sender: 'chatbot', text: reply, date: Date.now() })
  await chat.save()

  return { success: true, reply, chat }
}

const deleteChatbotMessageService = async ({ userId, messageId }) => {
  if (!userId || !messageId) return { success: false, message: 'Missing delete information' }

  const chat = await chatbotModel.findOne({ userId })
  if (!chat) return { success: false, message: 'Chatbot history not found' }

  const messageIndex = chat.messages.findIndex((message) => message._id.toString() === messageId)
  if (messageIndex === -1) return { success: false, message: 'Message not found' }
  if (chat.messages[messageIndex].sender !== 'customer') return { success: false, message: 'You can only delete your own messages' }

  const nextMessage = chat.messages[messageIndex + 1]
  const deleteCount = nextMessage?.sender === 'chatbot' ? 2 : 1
  chat.messages.splice(messageIndex, deleteCount)
  await chat.save()

  return { success: true, message: 'Message deleted', chat }
}

export { getChatbotHistoryService, chatbotReplyService, deleteChatbotMessageService }
