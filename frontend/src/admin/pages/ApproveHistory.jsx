import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { FiArrowLeft, FiCalendar, FiUserCheck } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { assets } from '../../assets/assets'
import { backendUrl, currency } from '../App'
import './ApproveHistory.css'

const getHistoryProductImage = (item) => {
  const image = Array.isArray(item.image) ? item.image[0] : item.image
  if (!image?.includes('/image/upload/')) return image
  return image.replace('/image/upload/', '/image/upload/c_pad,w_180,h_216,b_white,g_south/')
}

const formatMoney = (value) => `${currency}${Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`

const formatDateTime = (value) => {
  const date = new Date(value)
  return `${date.toLocaleDateString('en-GB')} - ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
}

const getCustomerName = (order) => {
  return order.customer?.name || `${order.address?.firstName || ''} ${order.address?.lastName || ''}`.trim() || 'Customer'
}

const getCustomerInitials = (order) => {
  return getCustomerName(order).split(' ').filter(Boolean).slice(0, 2).map((item) => item.charAt(0)).join('').toUpperCase()
}

const historyGradients = [assets.orange_gradient, assets.blue_gradient, assets.purple_gradient, assets.pink_gradient]

const getHistoryHeaderGradient = (orderId) => {
  const gradientIndex = [...String(orderId)].reduce((total, character) => total + character.charCodeAt(0), 0) % historyGradients.length
  return `linear-gradient(rgba(255, 255, 255, .62), rgba(255, 255, 255, .62)), url(${historyGradients[gradientIndex]})`
}

const ApproveHistory = ({ token }) => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchApproveHistory = async () => {
    try {
      setLoading(true)
      const response = await axios.post(backendUrl + '/api/order/list', {}, { headers: { token } })

      if (response.data.success) {
        const approvedOrders = [...response.data.orders].sort((a, b) => Number(b.approvedAt || b.date || 0) - Number(a.approvedAt || a.date || 0))
        setOrders(approvedOrders)
      } else toast.error(response.data.message)
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApproveHistory()
  }, [token])

  return (
    <div className='approve-history-page'>
      <div className='approve-history-header'>
        <div>
          <h1>Approve Order History</h1>
          <p>{orders.length} approved orders recorded by the admin team.</p>
        </div>
        <button type='button' onClick={() => navigate('/admin/approve-order')}><FiArrowLeft /> Back to Approve Order</button>
      </div>

      <div className='approve-history-list'>
        {loading ? <div className='approve-history-empty'>Loading approve history...</div> : orders.length === 0 ? <div className='approve-history-empty'>Nothing found !</div> : orders.map((order) => (
          <article key={order._id} className='approve-history-card'>
            <header className='approve-history-card-head' style={{ backgroundImage: getHistoryHeaderGradient(order._id) }}>
              <div className='approve-history-order-id'>
                <small>Approved Order</small>
                <h2>#{String(order._id).slice(-8).toUpperCase()}</h2>
                <p><FiCalendar /> {formatDateTime(order.approvedAt || order.date)}</p>
              </div>

              <div className='approve-history-admin'>
                <span><FiUserCheck /></span>
                <div>
                  <small>Approved by</small>
                  <b>{order.approvedByAdmin || 'Admin'}</b>
                </div>
              </div>
            </header>

            <div className='approve-history-summary'>
              <div className='approve-history-customer'>
                <div className='approve-history-avatar'>
                  {order.customer?.avatar ? <img src={order.customer.avatar} alt={getCustomerName(order)} /> : <span>{getCustomerInitials(order)}</span>}
                </div>
                <p><span>Customer</span><b>{getCustomerName(order)}</b></p>
              </div>
              <p><span>Products</span><b>{order.items.reduce((total, item) => total + Number(item.quantity || 0), 0)} items</b></p>
              <p><span>Payment Method</span><b>{order.paymentMethod}</b></p>
              <p><span>Order Total</span><b>{formatMoney(order.amount)}</b></p>
            </div>

            <div className='approve-history-products'>
              <div className='approve-history-products-title'>
                <div><small>Order Products</small><h3>Approved Items</h3></div>
                <span>{order.items.length} products</span>
              </div>

              {order.items.map((item, index) => (
                <div key={`${item._id || item.productId}-${item.size}-${index}`} className='approve-history-product'>
                  <span className='approve-history-number'>{index + 1}.</span>

                  <div className='approve-history-image'>
                    {getHistoryProductImage(item) ? <img src={getHistoryProductImage(item)} alt={item.name} /> : <span>{item.name?.charAt(0) || 'P'}</span>}
                  </div>

                  <div className='approve-history-product-info'>
                    <small>{item.subCategory || item.category || 'Product'}</small>
                    <p>{item.name}</p>
                  </div>

                  <div className='approve-history-product-meta'>
                    <span><small>Code</small><b>{item.code || 'No code'}</b></span>
                    <span><small>Size</small><b>{item.size || '-'}</b></span>
                    <span><small>Quantity</small><b>{item.quantity}</b></span>
                  </div>

                  <div className='approve-history-price'><span>Total</span><b>{formatMoney(Number(item.price || 0) * Number(item.quantity || 0))}</b></div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

export default ApproveHistory
