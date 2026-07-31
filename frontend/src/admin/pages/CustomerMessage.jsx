import React, { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { FiSearch } from 'react-icons/fi'
import { backendUrl } from '../App'
import { assets } from '../../assets/assets'
import ConfirmPopup from '../components/ConfirmPopup'
import './CustomerMessage.css'

const getCustomerAvatar = (avatar) => {
  if (!avatar?.includes('/image/upload/')) return avatar
  return avatar.replace('/image/upload/', '/image/upload/c_fill,w_120,h_120,g_face/')
}

const UserSearch = ({ users, chats, startingUserId, onSelect }) => {
  const [search, setSearch] = useState('')

  const searchedUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return []

    return users.filter((user) => user.name?.toLowerCase().includes(keyword) || user.email?.toLowerCase().includes(keyword)).slice(0, 6)
  }, [users, search])

  const selectUser = async (user) => {
    await onSelect(user)
    setSearch('')
  }

  return (
    <div className='client-user-search'>
      <div className='client-user-search-input'>
        <FiSearch />
        <input value={search} onChange={(event) => setSearch(event.target.value)} type='text' placeholder='Search user name or email...' />
      </div>

      {search.trim() && (
        <div className='client-user-search-results'>
          {searchedUsers.length > 0 ? searchedUsers.map((user) => {
            const hasConversation = chats.some((chat) => String(chat.userId) === String(user._id) || chat.email?.toLowerCase() === user.email?.toLowerCase())

            return (
              <button key={user._id} type='button' onClick={() => selectUser(user)} disabled={startingUserId === user._id}>
                <div className='client-search-avatar'>
                  {user.avatar ? <img src={getCustomerAvatar(user.avatar)} alt={user.name} /> : <span>{user.name?.charAt(0)?.toUpperCase() || 'U'}</span>}
                </div>
                <div>
                  <b>{user.name}</b>
                  <small>{user.email}</small>
                </div>
                <em>{startingUserId === user._id ? 'Opening...' : hasConversation ? 'Open Chat' : 'Start Chat'}</em>
              </button>
            )
          }) : <p>No users found</p>}
        </div>
      )}
    </div>
  )
}

const CustomerMessage = ({ token, clearMessageAlert, socket }) => {
  const [chats, setChats] = useState([])

  const [selectedChat, setSelectedChat] = useState(null)

  const replyInputRef = useRef(null)

  const [replying, setReplying] = useState(false)

  const [deletingId, setDeletingId] = useState('')

  const [deletingChat, setDeletingChat] = useState(null)
  const [deletingChatLoading, setDeletingChatLoading] = useState(false)

  const [users, setUsers] = useState([])

  const [startingUserId, setStartingUserId] = useState('')

  const formatTime = (date) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const getLastMessage = (chat) => {
    if (!chat.messages || chat.messages.length === 0) return null
    return chat.messages[chat.messages.length - 1]
  }

  const getLatestClientMessageDate = (chatList) => {
    if (!chatList || chatList.length === 0) return 0
    const clientMessageDates = chatList.flatMap((chat) => (chat.messages || []).filter((message) => message.sender === 'client').map((message) => Number(message.date || 0)))
    if (clientMessageDates.length === 0) return 0
    return Math.max(...clientMessageDates)
  }

  const fetchChats = async () => {
    if (!token) return

    try {
      const response = await axios.post(backendUrl + '/api/customer-message/list', {}, { headers: { token } })

      if (response.data.success) {
        setChats(response.data.chats)

        const latestClientMessageDate = getLatestClientMessageDate(response.data.chats)
        clearMessageAlert && clearMessageAlert(latestClientMessageDate)

        if (response.data.chats.length > 0 && !selectedChat) setSelectedChat(response.data.chats[0])

        if (selectedChat) {
          const updatedChat = response.data.chats.find((item) => item._id === selectedChat._id)
          if (updatedChat) setSelectedChat(updatedChat)
        }
      }
    } catch (error) {
      console.log(error)
    }
  }

  const fetchUsers = async () => {
    if (!token) return

    try {
      const response = await axios.get(backendUrl + '/api/user/admin-list', { headers: { token } })
      if (response.data.success) setUsers(response.data.users)
    } catch (error) {
      console.log(error)
    }
  }

  const startChatWithUser = async (user) => {
    const existingChat = chats.find((chat) => String(chat.userId) === String(user._id) || chat.email?.toLowerCase() === user.email?.toLowerCase())

    if (existingChat) {
      setSelectedChat(existingChat)
      return
    }

    try {
      setStartingUserId(user._id)
      const response = await axios.post(backendUrl + '/api/customer-message/admin-start', { userId: user._id }, { headers: { token } })

      if (response.data.success) {
        setChats((prev) => [response.data.chat, ...prev.filter((chat) => chat._id !== response.data.chat._id)])
        setSelectedChat(response.data.chat)
      } else toast.error(response.data.message)
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setStartingUserId('')
    }
  }

  const replyChat = async () => {
    const replyText = replyInputRef.current?.value.trim() || ''
    if (!replyText || !selectedChat || replying) return

    setReplying(true)
    replyInputRef.current.value = ''

    try {
      const response = await axios.post(backendUrl + '/api/customer-message/reply', { chatId: selectedChat._id, text: replyText }, { headers: { token } })

      if (response.data.success) {
        setSelectedChat(response.data.chat)
        setChats((prev) => prev.map((item) => item._id === response.data.chat._id ? response.data.chat : item))
      }
    } catch (error) {
      console.log(error)
      if (replyInputRef.current) replyInputRef.current.value = replyText
    } finally {
      setReplying(false)
    }
  }

  const deleteAdminMessage = async (messageId) => {
    if (!selectedChat || !messageId || deletingId) return

    const oldChat = selectedChat
    setDeletingId(messageId)

    setSelectedChat((prev) => ({ ...prev, messages: prev.messages.filter((item) => item._id !== messageId) }))

    try {
      const response = await axios.post(backendUrl + '/api/customer-message/delete-admin-message', { chatId: selectedChat._id, messageId }, { headers: { token } })

      if (response.data.success) {
        setSelectedChat(response.data.chat)
        setChats((prev) => prev.map((item) => item._id === response.data.chat._id ? response.data.chat : item))
      } else {
        setSelectedChat(oldChat)
      }
    } catch (error) {
      console.log(error)
      setSelectedChat(oldChat)
    } finally {
      setDeletingId('')
    }
  }

  const deleteConversation = async () => {
    if (!deletingChat || deletingChatLoading) return

    try {
      setDeletingChatLoading(true)
      const response = await axios.post(backendUrl + '/api/customer-message/delete-conversation', { chatId: deletingChat._id }, { headers: { token } })

      if (response.data.success) {
        const remainingChats = chats.filter((chat) => chat._id !== deletingChat._id)
        setChats(remainingChats)
        if (selectedChat?._id === deletingChat._id) setSelectedChat(remainingChats[0] || null)
        setDeletingChat(null)
      }
    } catch (error) {
      console.log(error)
    } finally {
      setDeletingChatLoading(false)
    }
  }

  useEffect(() => {
    fetchChats()
    fetchUsers()
  }, [token])

  const userLookup = useMemo(() => {
    const byId = new Map(users.map((user) => [String(user._id), user]))
    const byEmail = new Map(users.map((user) => [user.email?.toLowerCase(), user]))
    return { byId, byEmail }
  }, [users])

  const getChatUser = (chat) => {
    return userLookup.byId.get(String(chat.userId)) || userLookup.byEmail.get(chat.email?.toLowerCase())
  }

  useEffect(() => {
    if (!socket) return

    const updateCustomerChat = ({ chat, sender }) => {
      setChats((prev) => {
        const chatExists = prev.some((item) => item._id === chat._id)
        if (!chatExists) return [chat, ...prev]
        return prev.map((item) => item._id === chat._id ? chat : item)
      })

      setSelectedChat((prev) => !prev || prev._id === chat._id ? chat : prev)

      if (sender === 'client') {
        const latestClientMessageDate = getLatestClientMessageDate([chat])
        clearMessageAlert && clearMessageAlert(latestClientMessageDate)
      }
    }

    socket.on('customer-message:update', updateCustomerChat)
    return () => socket.off('customer-message:update', updateCustomerChat)
  }, [socket])

  return (
    <div className='client-chat'>
      {/* Background trang chat */}
      <div className='client-chat-bg'></div>

      
      <div className='client-chat-list'>
        
        <div className='client-chat-panel-header'>
          <div>
            <h2>Customer Messages</h2>
            <span>{chats.length} conversations</span>
          </div>
        </div>

        
        <UserSearch users={users} chats={chats} startingUserId={startingUserId} onSelect={startChatWithUser} />

        
        <div className='client-list-scroll'>
          {
            chats.map((chat) => {
              const lastMessage = getLastMessage(chat)
              const chatUser = getChatUser(chat)

              return (
                <div key={chat._id} className={`client-card ${selectedChat?._id === chat._id ? 'active' : ''}`} onClick={() => setSelectedChat(chat)}>
                  {/* Avatar client */}
                  <div className='client-avatar'>{chatUser?.avatar ? <img src={getCustomerAvatar(chatUser.avatar)} alt={chat.name} /> : chat.name?.charAt(0)?.toUpperCase() || 'C'}</div>

                  
                  <div className='client-card-info'>
                    <div className='client-card-top'>
                      <p className='client-name'>{chat.name}</p>
                      <small>{lastMessage ? formatTime(lastMessage.date) : '--:--'}</small>
                    </div>

                    <span>{chat.email}</span>
                    <p className='client-preview'>{lastMessage ? lastMessage.text : 'No messages yet'}</p>
                  </div>

                </div>
              )
            })
          }
        </div>
      </div>

      
      <div className='client-chat-content'>
        {
          selectedChat ?
            <>
              
              <div className='client-chat-header'>
                <div className='client-chat-user'>
                  <div className='client-chat-user-avatar'>{getChatUser(selectedChat)?.avatar ? <img src={getCustomerAvatar(getChatUser(selectedChat).avatar)} alt={selectedChat.name} /> : selectedChat.name?.charAt(0)?.toUpperCase() || 'C'}</div>

                  <div>
                    <h3>{selectedChat.name}</h3>
                    <span>{selectedChat.email}</span>
                  </div>
                </div>

                <button type='button' className='client-delete-chat-btn' title='Delete conversation' onClick={() => setDeletingChat(selectedChat)}>
                  <img src={assets.bin_icon} alt='Delete conversation' />
                </button>
              </div>

              
              <div className='client-chat-body'>
                {
                  selectedChat.messages.map((item, index) => (
                    <div key={item._id || index} className={`admin-chat-row ${item.sender === 'admin' ? 'admin-row' : 'client-row'}`}>
                      
                      {item.sender === 'admin' && item._id && <button type='button' className='admin-delete-message-btn' onClick={() => deleteAdminMessage(item._id)} disabled={deletingId === item._id}>🗑</button>}

                      
                      <div className={item.sender === 'admin' ? 'admin-message' : 'client-message'}>
                        <strong>{item.sender === 'admin' ? 'Admin' : 'Client'}</strong>
                        <p>{item.text}</p>
                        <small>{formatTime(item.date)}</small>
                      </div>
                    </div>
                  ))
                }
              </div>

              
              <div className='client-chat-footer'>
                <input ref={replyInputRef} type='text' placeholder='Reply to client...' onKeyDown={(event) => event.key === 'Enter' && replyChat()} />
                <button type='button' onClick={replyChat} disabled={replying}>{replying ? 'Sending...' : 'Send'}</button>
              </div>
            </>
            :
            <div className='empty-chat'>No conversation selected</div>
        }
      </div>

      {deletingChat && (
        <ConfirmPopup
          title='Delete Conversation?'
          message={`Are you sure you want to delete the entire conversation with ${deletingChat.name}? This action cannot be undone.`}
          confirmText='Delete Conversation'
          loading={deletingChatLoading}
          onCancel={() => !deletingChatLoading && setDeletingChat(null)}
          onConfirm={deleteConversation}
        />
      )}
    </div>
  )
}

export default CustomerMessage
