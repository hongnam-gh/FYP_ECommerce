import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { io } from 'socket.io-client'
import { useNavigate } from 'react-router-dom'
import { FiHeadphones, FiMessageCircle, FiX } from 'react-icons/fi'
import { FaFacebookF, FaInstagram } from 'react-icons/fa'
import { TbRobot } from 'react-icons/tb'
import { assets } from '../assets/assets'
import useAuth from '../hooks/useAuth'
import { backendUrl } from '../constants/shopConfig'
import './Chat.css'

const Chat = () => {
  const { token } = useAuth()
  const navigate = useNavigate()

  const [openChat, setOpenChat] = useState(false)

  const [contactMenuCollapsed, setContactMenuCollapsed] = useState(() => localStorage.getItem('chatContactMenuCollapsed') === 'true')
  const openContactMenu = !contactMenuCollapsed && !openChat

  const [chatMode, setChatMode] = useState('admin')

  const [chatId, setChatId] = useState('')

  const [text, setText] = useState('')

  const [sending, setSending] = useState(false)

  const [deletingId, setDeletingId] = useState('')

  const [clientInfo, setClientInfo] = useState({ userId: '', name: '', email: '' })

  const [messages, setMessages] = useState([])

  const [chatbotMessages, setChatbotMessages] = useState([])

  const [unreadAdminCount, setUnreadAdminCount] = useState(0)

  const chatbotSuggestions = [
    'How do I choose the right size?',
    'How does order approval work?',
    'How can I track my order?',
    'What payment methods are available?',
    'How do wishlist and cart work?'
  ]

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const fetchUserProfile = async () => {
    if (!token) {
      setChatId('')
      setClientInfo({ userId: '', name: '', email: '' })
      setMessages([])
      setChatbotMessages([])
      setUnreadAdminCount(0)
      return
    }

    try {
      const response = await axios.post(backendUrl + '/api/user/profile', {}, { headers: { token } })

      if (response.data.success) {
        setClientInfo({ userId: response.data.user._id, name: response.data.user.name, email: response.data.user.email })
      }
    } catch (error) {
      console.log(error)
    }
  }

  const fetchChatbotHistory = async () => {
    if (!token) return

    try {
      const response = await axios.post(backendUrl + '/api/chatbot/history', {}, { headers: { token } })

      if (response.data.success) {
        setChatbotMessages(response.data.chat?.messages || [])
      }
    } catch (error) {
      console.log(error)
    }
  }

  const fetchClientChat = async (email) => {
    if (!email) return

    try {
      const response = await axios.post(backendUrl + '/api/customer-message/client', { email })

      if (response.data.success && response.data.chat) {
        setChatId(response.data.chat._id)
        setMessages(response.data.chat.messages)
      }
    } catch (error) {
      console.log(error)
    }
  }

  const sendAdminMessage = async (message = text) => {
    if (!message.trim() || !clientInfo.name || !clientInfo.email || sending) return

    const messageText = message.trim()
    setSending(true)
    setText('')

    try {
      const response = await axios.post(backendUrl + '/api/customer-message/send', { userId: clientInfo.userId, name: clientInfo.name, email: clientInfo.email, text: messageText }, { headers: { token } })

      if (response.data.success && response.data.chat) {
        setChatId(response.data.chat._id)
        setMessages(response.data.chat.messages)
      }
    } catch (error) {
      console.log(error)
    } finally {
      setSending(false)
    }
  }

  const sendChatbotMessage = async (message = text) => {
    if (!message.trim() || sending) return

    const messageText = message.trim()
    const nextMessages = [...chatbotMessages, { sender: 'customer', text: messageText, date: Date.now() }]
    setSending(true)
    setText('')
    setChatbotMessages(nextMessages)

    try {
      const response = await axios.post(backendUrl + '/api/chatbot/reply', { text: messageText }, { headers: { token } })

      if (response.data.success) {
        setChatbotMessages(response.data.chat.messages)
      } else {
        const savedMessages = response.data.chat?.messages || nextMessages
        setChatbotMessages([...savedMessages, { sender: 'chatbot', text: response.data.message, date: Date.now() }])
      }
    } catch (error) {
      console.log(error)
      setChatbotMessages((prev) => [...prev, { sender: 'chatbot', text: 'Chatbot is unavailable right now. Please try again or switch to Admin Support.', date: Date.now() }])
    } finally {
      setSending(false)
    }
  }

  const sendMessage = (message = text) => {
    if (chatMode === 'chatbot') {
      sendChatbotMessage(message)
    } else {
      sendAdminMessage(message)
    }
  }

  const sendSuggestion = (message) => {
    if (sending) return
    setChatMode('chatbot')
    sendChatbotMessage(message)
  }

  const deleteClientMessage = async (messageId) => {
    if (!chatId || !messageId || deletingId) return

    const oldMessages = messages
    setDeletingId(messageId)
    setMessages(prev => prev.filter(item => item._id !== messageId))

    try {
      const response = await axios.post(backendUrl + '/api/customer-message/delete-client-message', { chatId, messageId, email: clientInfo.email }, { headers: { token } })

      if (response.data.success && response.data.chat) {
        setMessages(response.data.chat.messages)
      } else {
        setMessages(oldMessages)
      }
    } catch (error) {
      console.log(error)
      setMessages(oldMessages)
    } finally {
      setDeletingId('')
    }
  }

  const deleteChatbotMessage = async (messageId) => {
    if (!messageId || deletingId) return

    const oldMessages = chatbotMessages
    const messageIndex = chatbotMessages.findIndex((item) => item._id === messageId)
    const nextMessage = chatbotMessages[messageIndex + 1]
    const deletedIds = [messageId]
    if (nextMessage?.sender === 'chatbot') deletedIds.push(nextMessage._id)

    setDeletingId(messageId)
    setChatbotMessages((prev) => prev.filter((item) => !deletedIds.includes(item._id)))

    try {
      const response = await axios.post(backendUrl + '/api/chatbot/delete-message', { messageId }, { headers: { token } })

      if (response.data.success && response.data.chat) {
        setChatbotMessages(response.data.chat.messages)
      } else {
        setChatbotMessages(oldMessages)
      }
    } catch (error) {
      console.log(error)
      setChatbotMessages(oldMessages)
    } finally {
      setDeletingId('')
    }
  }

  const handleKeyDown = (event) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    sendMessage(event.currentTarget.value)
  }

  const goLogin = () => {
    setOpenChat(false)
    navigate('/login')
  }

  const goSignup = () => {
    setOpenChat(false)
    navigate('/signup')
  }

  const collapseContactMenu = () => {
    localStorage.setItem('chatContactMenuCollapsed', 'true')
    setContactMenuCollapsed(true)
  }

  const expandContactMenu = () => {
    localStorage.removeItem('chatContactMenuCollapsed')
    setContactMenuCollapsed(false)
  }

  useEffect(() => {
    const closeChatOnHover = (event) => {
      if (event.target.closest('.chat-auto-close')) setOpenChat(false)
    }

    const closeChatEvent = () => setOpenChat(false)
    const openChatEvent = () => {
      setChatMode('admin')
      setOpenChat(true)
    }

    document.addEventListener('mouseover', closeChatOnHover)
    window.addEventListener('close-chat', closeChatEvent)
    window.addEventListener('open-chat', openChatEvent)

    return () => {
      document.removeEventListener('mouseover', closeChatOnHover)
      window.removeEventListener('close-chat', closeChatEvent)
      window.removeEventListener('open-chat', openChatEvent)
    }
  }, [])

  useEffect(() => {
    if (!openChat) return

    const closeChatOnOutsideClick = (event) => {
      if (event.target.closest('.chat-box') || event.target.closest('.chat-button') || event.target.closest('.chat-contact-menu')) return

      setOpenChat(false)
    }

    document.addEventListener('mousedown', closeChatOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeChatOnOutsideClick)
  }, [openChat])

  useEffect(() => {
    fetchUserProfile()
    fetchChatbotHistory()
  }, [token])

  useEffect(() => {
    if (clientInfo.email) fetchClientChat(clientInfo.email)
  }, [clientInfo.email])

  useEffect(() => {
    if (!clientInfo.userId) return

    const seenKey = `chatAdminSeen:${clientInfo.userId}`
    const adminMessages = messages.filter((message) => message.sender === 'admin')
    const latestAdminDate = Math.max(0, ...adminMessages.map((message) => Number(message.date || 0)))

    if (openChat && chatMode === 'admin') {
      if (latestAdminDate > 0) localStorage.setItem(seenKey, String(latestAdminDate))
      setUnreadAdminCount(0)
      return
    }

    const lastSeenDate = Number(localStorage.getItem(seenKey) || 0)
    setUnreadAdminCount(adminMessages.filter((message) => Number(message.date || 0) > lastSeenDate).length)
  }, [messages, openChat, chatMode, clientInfo.userId])

  useEffect(() => {
    if (!token) return

    const socket = io(backendUrl, { auth: { token } })
    const updateClientChat = ({ chat }) => {
      setChatId(chat._id)
      setMessages(chat.messages)
    }

    socket.on('customer-message:update', updateClientChat)

    return () => {
      socket.off('customer-message:update', updateClientChat)
      socket.disconnect()
    }
  }, [token])

  return (
    <>
      <div className={`chat-box ${chatMode === 'chatbot' ? 'chat-box-chatbot' : ''} ${openChat ? 'show-chat' : ''}`}>
        <div className='chat-header'>
          <div>
            <p>{chatMode === 'chatbot' ? 'Chatbot Support' : 'Admin Support'}</p>
            <span>{chatMode === 'chatbot' ? 'AI assistant powered by OpenRouter' : token ? 'Active Now' : 'Login required to chat'}</span>
          </div>
          <div className='chat-header-actions'>
            <button type='button' onClick={() => setOpenChat(false)} title='Close chat'>×</button>
          </div>
        </div>

        {!token ? (
          <div className='chat-login-box'>
            <div className='chat-login-badge'>Members only</div>
            <h3>Sign in to start chatting</h3>
            <p>Login or create an account so our support team knows who the hell they are helping.</p>
            <div className='chat-login-actions'>
              <button type='button' onClick={goLogin}>Login</button>
              <button type='button' onClick={goSignup}>Sign Up</button>
            </div>
          </div>
        ) : (
          <>
            <div className='chat-body'>
              
              <div className='chat-welcome-message'>
                {chatMode === 'chatbot' ? 'Hi, I am the Distressed AI assistant. What can I help you with?' : 'Hi, how can I assist you today?'}
              </div>

              {chatMode === 'chatbot' && chatbotMessages.length === 0 && (
                <div className='chat-suggestion-list'>
                  {chatbotSuggestions.map((suggestion) => (
                    <button key={suggestion} type='button' onClick={() => sendSuggestion(suggestion)} disabled={sending} className='chat-suggestion-chip'>{suggestion}</button>
                  ))}
                </div>
              )}

              {(chatMode === 'chatbot' ? chatbotMessages : messages).map((item, index) => (
                <div key={item._id || index} className={`chat-message-row ${['client', 'customer'].includes(item.sender) ? 'client-row' : 'admin-row'}`}>
                  {((chatMode === 'admin' && item.sender === 'client') || (chatMode === 'chatbot' && item.sender === 'customer')) && item._id && (
                    <button type='button' className='chat-delete-btn' onClick={() => chatMode === 'chatbot' ? deleteChatbotMessage(item._id) : deleteClientMessage(item._id)} disabled={deletingId === item._id}>🗑</button>
                  )}

                  <div className={['client', 'customer'].includes(item.sender) ? 'client-message' : 'admin-message'}>
                    <span>{item.text}</span>
                    <small>{formatTime(item.date)}</small>
                  </div>
                </div>
              ))}
            </div>

            <div className='chat-input-area'>
              <input type='text' value={text} maxLength={1000} onChange={(event) => setText(event.target.value)} onKeyDown={handleKeyDown} placeholder={chatMode === 'chatbot' ? 'Ask the chatbot...' : 'Type your message...'} />
              <button type='button' onClick={() => sendMessage()} disabled={sending}>{sending ? '...' : 'Send'}</button>
            </div>
          </>
        )}

        <div className='chat-navigation'>
          <button type='button' onClick={() => setChatMode('admin')} className={`chat-navigation-button ${chatMode === 'admin' ? 'active' : ''}`}>
            <FiHeadphones />
            <span>Admin</span>
            {unreadAdminCount > 0 && <b className='chat-navigation-count'>{unreadAdminCount > 99 ? '99+' : unreadAdminCount}</b>}
          </button>
          <button type='button' onClick={() => setChatMode('chatbot')} className={`chat-navigation-button ${chatMode === 'chatbot' ? 'active' : ''}`}>
            <TbRobot />
            <span>Chatbot</span>
          </button>
        </div>
      </div>

      <div className={`chat-contact-menu ${openContactMenu ? 'open' : ''}`}>
        <button type='button' title='Chat with Admin' onClick={() => { setChatMode('admin'); setOpenChat(true) }} className='chat-contact-option chat-contact-admin'>
          <span>💬</span>
          {unreadAdminCount > 0 && <b className='chat-unread-count'>{unreadAdminCount > 99 ? '99+' : unreadAdminCount}</b>}
        </button>
        <a href={import.meta.env.VITE_ZALO_URL || 'https://zalo.me'} target='_blank' rel='noreferrer' title='Zalo' className='chat-contact-option chat-contact-zalo'><img src={assets.zalo_icon} alt='Zalo' /></a>
        <a href={import.meta.env.VITE_INSTAGRAM_URL || 'https://www.instagram.com'} target='_blank' rel='noreferrer' title='Instagram' className='chat-contact-option chat-contact-instagram'><FaInstagram /></a>
        <a href={import.meta.env.VITE_FACEBOOK_URL || 'https://www.facebook.com'} target='_blank' rel='noreferrer' title='Facebook' className='chat-contact-option chat-contact-facebook'><FaFacebookF /></a>
      </div>

      <button type='button' aria-label={openChat || openContactMenu ? 'Close support' : 'Open support menu'} className={`chat-button ${openContactMenu ? 'chat-button-close' : ''}`} onClick={() => { if (openChat) setOpenChat(false); else if (openContactMenu) collapseContactMenu(); else expandContactMenu() }}>
        {openContactMenu ? <FiX /> : <FiMessageCircle />}
        {!openContactMenu && unreadAdminCount > 0 && <span className='chat-unread-count'>{unreadAdminCount > 99 ? '99+' : unreadAdminCount}</span>}
      </button>
    </>
  )
}

export default Chat
