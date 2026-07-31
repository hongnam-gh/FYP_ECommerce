import React, { useEffect, useState } from 'react'
import { Navigate, Routes, Route, useLocation } from 'react-router-dom'
import axios from 'axios'
import { io } from 'socket.io-client'
import './App.css'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import AdminLogin from './components/AdminLogin'
import AdminSignup from './components/AdminSignup'
import Add from './pages/Add'
import List from './pages/List'
import OrdersAdmin from './pages/OrdersAdmin'
import ApproveOrder from './pages/ApproveOrder'
import CustomerMessage from './pages/CustomerMessage'
import Inventory from './pages/Inventory'
import EditProduct from './pages/EditProduct'
import BannerManagement from './pages/BannerManagement'
import CollectionManagement from './pages/CollectionManagement'
import CollectionManagementView from './pages/CollectionManagementView'
import StatisticManagement from './pages/StatisticManagement'
import UserManagement from './pages/UserManagement'
import ApproveHistory from './pages/ApproveHistory'

export const backendUrl = import.meta.env.VITE_BACKEND_URL
export const currency = '$'

const App = () => {
  const location = useLocation()

  useEffect(() => {
    document.title = 'DISTRESSED ™ | Admin Panel'
  }, [])

  const [token, setToken] = useState(localStorage.getItem('adminToken') ? localStorage.getItem('adminToken') : '')

  const [adminName, setAdminName] = useState(localStorage.getItem('adminName') ? localStorage.getItem('adminName') : '')

  const [sidebarAlerts, setSidebarAlerts] = useState({ orders: false, approvals: false, messages: false })

  const [adminSocket, setAdminSocket] = useState(null)

  useEffect(() => {
    localStorage.setItem('adminToken', token)
    setAdminName(localStorage.getItem('adminName') ? localStorage.getItem('adminName') : '')
  }, [token])

  const logoutAdmin = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminName')
    setAdminName('')
    setToken('')
  }

  const getLatestOrderDate = (orders) => {
    if (!orders || orders.length === 0) return 0
    return Math.max(...orders.map((order) => Number(order.date || 0)))
  }

  const getLatestClientMessageDate = (chats) => {
    if (!chats || chats.length === 0) return 0
    const clientMessageDates = chats.flatMap((chat) => (chat.messages || []).filter((message) => message.sender === 'client').map((message) => Number(message.date || 0)))
    if (clientMessageDates.length === 0) return 0
    return Math.max(...clientMessageDates)
  }

  const checkSidebarAlerts = async () => {
    if (!token) return

    try {
      const chatRequest = location.pathname === '/admin/customer-message'
        ? Promise.resolve({ data: { success: true, chats: [] } })
        : axios.post(backendUrl + '/api/customer-message/list', {}, { headers: { token } })

      const [orderResponse, approvalResponse, chatResponse] = await Promise.all([
        axios.post(backendUrl + '/api/order/list', {}, { headers: { token } }),
        axios.post(backendUrl + '/api/wait-for-approve/list', {}, { headers: { token } }),
        chatRequest
      ])

      const latestOrderDate = orderResponse.data.success ? getLatestOrderDate(orderResponse.data.orders) : 0
      const hasPendingApproval = approvalResponse.data.success && approvalResponse.data.orders.length > 0
      const latestClientMessageDate = chatResponse.data.success ? getLatestClientMessageDate(chatResponse.data.chats) : 0

      const seenOrderDate = Number(localStorage.getItem('adminSeenOrderDate') || 0)
      const seenClientMessageDate = Number(localStorage.getItem('adminSeenClientMessageDate') || 0)

      setSidebarAlerts({
        orders: latestOrderDate > seenOrderDate && location.pathname !== '/admin/orders',
        approvals: hasPendingApproval,
        messages: latestClientMessageDate > seenClientMessageDate && location.pathname !== '/admin/customer-message'
      })
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    if (!token) return
    checkSidebarAlerts()
    const alertInterval = setInterval(checkSidebarAlerts, 8000)
    return () => clearInterval(alertInterval)
  }, [token, location.pathname])

  useEffect(() => {
    if (!token) return

    const socket = io(backendUrl, { auth: { token } })
    const updateMessageAlert = ({ chat, sender }) => {
      if (sender !== 'client') return

      const latestClientMessageDate = getLatestClientMessageDate([chat])
      if (location.pathname === '/admin/customer-message') {
        clearMessageAlert(latestClientMessageDate)
      } else {
        setSidebarAlerts((prev) => ({ ...prev, messages: true }))
      }
    }

    const updateOrderData = () => {
      checkSidebarAlerts()
    }

    setAdminSocket(socket)
    socket.on('customer-message:update', updateMessageAlert)
    socket.on('admin-orders:update', updateOrderData)

    return () => {
      socket.off('customer-message:update', updateMessageAlert)
      socket.off('admin-orders:update', updateOrderData)
      socket.disconnect()
      setAdminSocket(null)
    }
  }, [token, location.pathname])

  const clearOrderAlert = (latestOrderDate = 0) => {
    localStorage.setItem('adminSeenOrderDate', String(latestOrderDate))
    setSidebarAlerts((prev) => ({ ...prev, orders: false }))
  }

  const updateApprovalAlert = (hasPendingApproval = false) => {
    setSidebarAlerts((prev) => ({ ...prev, approvals: hasPendingApproval }))
  }

  const clearMessageAlert = (latestClientMessageDate = 0) => {
    localStorage.setItem('adminSeenClientMessageDate', String(latestClientMessageDate))
    setSidebarAlerts((prev) => ({ ...prev, messages: false }))
  }

  return (
    <div className={token === '' ? 'app admin-auth-app' : 'app'}>
      {token === ''
        ? location.pathname === '/admin/signup' ? <AdminSignup setToken={setToken} /> : <AdminLogin setToken={setToken} />
        : <>
          <Navbar />

          <div className='app-layout'>
            <Sidebar alerts={sidebarAlerts} adminName={adminName} logoutAdmin={logoutAdmin} />

            <Routes>
              <Route index element={<Navigate to='/admin/approve-order' replace />} />
              <Route path='customer-message' element={<div className='app-chat-page'><CustomerMessage token={token} clearMessageAlert={clearMessageAlert} socket={adminSocket} /></div>} />
              <Route path='user-management' element={<div className='app-page'><UserManagement token={token} /></div>} />
              <Route path='statistics' element={<div className='app-page'><StatisticManagement token={token} /></div>} />
              <Route path='add' element={<div className='app-page'><Add token={token} /></div>} />
              <Route path='list' element={<div className='app-page'><List token={token} /></div>} />
              <Route path='edit-product/:id' element={<div className='app-page'><EditProduct token={token} /></div>} />
              <Route path='inventory' element={<div className='app-page'><Inventory token={token} /></div>} />
              <Route path='banner-management' element={<div className='app-page'><BannerManagement token={token} /></div>} />
              <Route path='banner-management/:pageId' element={<div className='app-page'><BannerManagement token={token} /></div>} />
              <Route path='collection-management' element={<div className='app-page'><CollectionManagement token={token} /></div>} />
              <Route path='collection-management/:collectionId' element={<div className='app-page'><CollectionManagementView token={token} /></div>} />
              <Route path='collection-banner-management/*' element={<Navigate to='/admin/collection-management' replace />} />
              <Route path='approve-order' element={<div className='app-page'><ApproveOrder token={token} updateApprovalAlert={updateApprovalAlert} socket={adminSocket} /></div>} />
              <Route path='approve-history' element={<div className='app-page'><ApproveHistory token={token} /></div>} />
              <Route path='orders' element={<div className='app-page'><OrdersAdmin token={token} clearOrderAlert={clearOrderAlert} socket={adminSocket} /></div>} />
              <Route path='*' element={<Navigate to='/admin/approve-order' replace />} />
            </Routes>
          </div>
        </>
      }
    </div>
  )
}

export default App
