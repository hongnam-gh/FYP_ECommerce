import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { FiCalendar, FiClock, FiMail, FiMapPin, FiPhone } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { assets } from '../../assets/assets'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'
import './OrdersAdmin.css'

const getOrderProductImage = (item) => {
  const image = Array.isArray(item.image) ? item.image[0] : item.image
  if (!image?.includes('/image/upload/')) return image
  return image.replace('/image/upload/', '/image/upload/c_pad,w_180,h_216,b_white,g_south/')
}

const getCustomerName = (order) => {
  return order.customer?.name || `${order.address.firstName || ''} ${order.address.lastName || ''}`.trim() || 'Customer'
}

const getCustomerInitials = (order) => {
  return getCustomerName(order).split(' ').filter(Boolean).slice(0, 2).map((item) => item.charAt(0)).join('').toUpperCase()
}

const formatMoney = (value) => `${currency}${Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`

const formatOrderDateTime = (value) => {
  const orderDate = new Date(value)
  const date = orderDate.toLocaleDateString('en-GB')
  const time = orderDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return `${date} - ${time}`
}

const membershipRankColors = {
  Standard: '#374151',
  Silver: '#64748b',
  Gold: '#b45309',
  Diamond: '#0e7490'
}

const orderGradients = [assets.orange_gradient, assets.blue_gradient, assets.purple_gradient, assets.pink_gradient]

const getOrderHeaderGradient = (orderId) => {
  const gradientIndex = [...String(orderId)].reduce((total, character) => total + character.charCodeAt(0), 0) % orderGradients.length
  return `linear-gradient(rgba(255, 255, 255, .56), rgba(255, 255, 255, .56)), url(${orderGradients[gradientIndex]})`
}

const ApproveOrder = ({ token, updateApprovalAlert, socket }) => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [rejectOrderId, setRejectOrderId] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchWaitingOrders = async () => {
    if (!token) return null

    try {
      const response = await axios.post(backendUrl + '/api/wait-for-approve/list', {}, { headers: { token } })

      if (response.data.success) {
        setOrders(response.data.orders)
        updateApprovalAlert && updateApprovalAlert(response.data.orders.length > 0)
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const approveOrder = async (orderId) => {
    if (isSubmitting) return

    try {
      setIsSubmitting(true)
      const response = await axios.post(backendUrl + '/api/wait-for-approve/approve', { orderId }, { headers: { token } })

      if (response.data.success) {
        toast.success(response.data.message)
        await fetchWaitingOrders()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const openRejectModal = (orderId) => {
    setRejectOrderId(orderId)
    setRejectReason('')
  }

  const closeRejectModal = () => {
    if (isSubmitting) return
    setRejectOrderId('')
    setRejectReason('')
  }

  const submitReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Reject reason is required')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await axios.post(backendUrl + '/api/rejected-order/reject', { orderId: rejectOrderId, reason: rejectReason }, { headers: { token } })

      if (response.data.success) {
        toast.success(response.data.message)
        closeRejectModal()
        await fetchWaitingOrders()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    fetchWaitingOrders()
  }, [token])

  useEffect(() => {
    if (!socket) return

    socket.on('admin-orders:update', fetchWaitingOrders)
    return () => socket.off('admin-orders:update', fetchWaitingOrders)
  }, [socket, token])

  return (
    <div className='admin-orders-page'>
      
      <div className='admin-orders-header'>
        <div>
          <h1 className='admin-orders-title'>Approve Order</h1>
          <p className='admin-orders-subtitle'>Review pending customer orders before approving fulfillment or sending a rejection reason.</p>
        </div>
        <button type='button' onClick={() => navigate('/admin/approve-history')} className='admin-approve-history-btn'><FiClock /> Approve Order History</button>
      </div>

      <div className='admin-orders-list'>
        {orders.map((order) => (
          <article className='admin-order-detail-card admin-approval-detail-card' key={order._id}>
            <header className='admin-order-detail-head' style={{ backgroundImage: getOrderHeaderGradient(order._id) }}>
              <div>
                <small>Order #{String(order._id).slice(-8).toUpperCase()}</small>
                <p><FiCalendar /> {formatOrderDateTime(order.date)}</p>
              </div>

              <div className='admin-order-detail-status'>
                <div className='admin-order-head-info admin-approval-head-info'>
                  <p><span>Membership Rank</span><b style={{ color: membershipRankColors[order.membershipRank] || membershipRankColors.Standard }}>{order.membershipRank || 'Standard'}</b></p>
                  <p><span>Payment Status</span><b className={order.payment ? 'paid' : 'pending'}>{order.payment ? 'Paid' : 'Payment Pending'}</b></p>
                  <p><span>Approval Status</span><b className='waiting'>Waiting Approval</b></p>
                  <p><span>Payment Method</span><b>{order.paymentMethod}</b></p>
                  <p><span>Order Total</span><b>{formatMoney(order.amount)}</b></p>
                </div>
              </div>
            </header>

            <div className='admin-order-detail-body'>
              <section className='admin-order-products'>
                <div className='admin-order-section-title'><div><small>Products</small><h2>Review Order Items</h2></div><span>{order.items.reduce((total, item) => total + Number(item.quantity || 0), 0)} units</span></div>

                <div className='admin-order-product-list'>
                  {order.items.map((item, index) => (
                    <div className='admin-order-product' key={`${item._id || item.productId}-${item.size}-${index}`}>
                      <span className='admin-order-product-number'>{index + 1}.</span>

                      <div className='admin-order-product-image'>
                        {getOrderProductImage(item) ? <img src={getOrderProductImage(item)} alt={item.name} /> : <span>{item.name?.charAt(0) || 'P'}</span>}
                      </div>

                      <div className='admin-order-product-info'>
                        <small>{item.subCategory || item.category || 'Product'}</small>
                        <p>{item.name}</p>
                      </div>

                      <div className='admin-order-product-meta'>
                        <span><small>Code</small><b>{item.code || 'No code'}</b></span>
                        <span><small>Size</small><b>{item.size || '-'}</b></span>
                        <span><small>Quantity</small><b>{item.quantity}</b></span>
                      </div>

                      <div className='admin-order-product-price'><span>Total</span><b>{formatMoney(Number(item.price || 0) * Number(item.quantity || 0))}</b></div>
                    </div>
                  ))}
                </div>
              </section>

              <aside className='admin-order-sidebar'>
                <section className='admin-order-info-card'>
                  <div className='admin-order-section-title'><div><small>Customer</small><h2>Customer Details</h2></div></div>

                  <div className='admin-order-customer'>
                    <div className='admin-order-avatar'>{order.customer?.avatar ? <img src={order.customer.avatar} alt={getCustomerName(order)} /> : <span>{getCustomerInitials(order)}</span>}</div>
                    <div><p>{getCustomerName(order)}</p><span>Customer account</span></div>
                  </div>

                  <div className='admin-order-contact-list'>
                    <p><FiMail /><span>{order.customer?.email || order.address.email || 'Email not provided'}</span></p>
                    <p><FiPhone /><span>{order.address.phone || 'Phone not provided'}</span></p>
                  </div>
                </section>

                <section className='admin-order-info-card'>
                  <div className='admin-order-section-title'><div><small>Delivery</small><h2>Shipping Address</h2></div></div>
                  <div className='admin-order-address'><FiMapPin /><p><strong>{order.address.firstName} {order.address.lastName}</strong><span>{order.address.street}</span><span>{[order.address.city, order.address.state, order.address.country, order.address.zipcode].filter(Boolean).join(', ')}</span></p></div>
                </section>
              </aside>
            </div>

            <footer className='admin-approval-detail-actions'>
              <p>Review product availability and customer information before making a decision.</p>
              <div>
              <button type='button' disabled={isSubmitting} onClick={() => approveOrder(order._id)} className='admin-approve-btn'>Approve</button>
              <button type='button' disabled={isSubmitting} onClick={() => openRejectModal(order._id)} className='admin-reject-btn'>Reject</button>
              </div>
            </footer>
          </article>
        ))}

        {orders.length === 0 && <p className='admin-empty-orders'>No orders waiting for approval.</p>}
      </div>

      {rejectOrderId && (
        <div className='admin-reject-overlay'>
          <div className='admin-reject-modal'>
            <h3>Reject Order</h3>
            <p>Please enter a reason. The user will see this in their order history.</p>
            <textarea value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} placeholder='Reason for rejection' className='admin-reject-textarea' />

            <div className='admin-reject-modal-actions'>
              <button type='button' onClick={closeRejectModal} disabled={isSubmitting} className='admin-reject-cancel-btn'>Cancel</button>
              <button type='button' onClick={submitReject} disabled={isSubmitting} className='admin-reject-submit-btn'>{isSubmitting ? 'Rejecting...' : 'Submit Reject'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApproveOrder
