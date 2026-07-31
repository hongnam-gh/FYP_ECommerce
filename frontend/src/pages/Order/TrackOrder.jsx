import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import useAuth from '../../hooks/useAuth'
import { backendUrl, currency } from '../../constants/shopConfig'
import './TrackOrder.css'

const TrackOrder = () => {
  const { orderId } = useParams()
  const { token } = useAuth()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  const steps = ['Order Placed', 'Packing', 'Shipped', 'Out for Delivery', 'Delivered']

  const loadOrder = async () => {
    try {
      if (!token) {
        window.location.href = '/login?redirect=/orders'
        return null
      }

      const response = await axios.post(backendUrl + '/api/order/single', { orderId }, { headers: { token } })

      if (response.data.success) {
        setOrder(response.data.order)
      } else {
        toast.error(response.data.message)
        window.location.href = '/orders'
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
      window.location.href = '/orders'
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrder()
  }, [token, orderId])

  useEffect(() => {
    const refreshTrackedOrder = (event) => {
      const notification = event.detail?.notification
      if (String(notification?.orderId) !== String(orderId)) return
      loadOrder()
    }

    window.addEventListener('order-status-updated', refreshTrackedOrder)
    return () => window.removeEventListener('order-status-updated', refreshTrackedOrder)
  }, [token, orderId])

  const getDisplayStatus = () => {
    if (order?.approvalStatus === 'waiting') return 'Wait For Approve'
    if (order?.approvalStatus === 'rejected') return 'Rejected'
    return order?.status
  }

  const getStatusClass = () => {
    const status = getDisplayStatus()

    if (status === 'Rejected') return 'track-status-rejected'
    if (status === 'Wait For Approve') return 'track-status-waiting'
    if (status === 'Order Placed') return 'track-status-placed'
    return ''
  }

  const getPaymentClass = () => {
    const paymentMethod = order?.paymentMethod?.toLowerCase()

    if (paymentMethod === 'cod') return 'track-payment-cod'
    if (paymentMethod === 'stripe') return 'track-payment-stripe'
    if (paymentMethod === 'momo') return 'track-payment-momo'
    return ''
  }

  const formatOrderDate = (date) => {
    const orderDate = new Date(date)
    const hours = String(orderDate.getHours()).padStart(2, '0')
    const minutes = String(orderDate.getMinutes()).padStart(2, '0')
    const day = orderDate.getDate()
    const month = orderDate.getMonth() + 1
    const year = orderDate.getFullYear()

    return `${hours}:${minutes} ${day}/${month}/${year}`
  }

  const isApprovedOrder = order?.approvalStatus === 'approved' || !order?.approvalStatus
  const currentStep = order && isApprovedOrder ? Math.max(steps.findIndex(step => step.toLowerCase() === order.status.toLowerCase()), 0) : 0
  const progressWidth = `${(currentStep / (steps.length - 1)) * 80}%`

  if (loading) {
    return (
      
      <div className='track-loading-page'>
        <div className='track-spinner'></div>
      </div>
    )
  }

  if (!order) return null

  return (
    <div className='track-page'>
      {/* Page title */}
      <div className='track-title'>
        <h1 className="title"><span className="title-text">TRACK <span className="title-highlight">ORDER</span></span><span className="title-line"></span></h1>
      </div>

      <div className='track-card'>
        {/* Header: order id + badges */}
        <div className='track-header'>
          <div>
            <p className='track-label'>Order ID</p>
            <p className='track-order-id'>{order._id}</p>
          </div>

          <div className='track-badges'>
            <span className={`track-payment-badge ${getPaymentClass()}`}>{order.paymentMethod}</span>
            <span className={`track-status-badge ${getStatusClass()}`}>{getDisplayStatus()}</span>
          </div>
        </div>

        {/* Order progress tracker */}
        {isApprovedOrder ? <div className='track-progress-section'>
          <div className='track-progress-wrap'>
            <div className='track-progress-bg'></div>
            <div className='track-progress-fill' style={{ width: progressWidth }}></div>

            <div className='track-steps'>
              {steps.map((step, index) => (
                <div key={step} className='track-step'>
                  <div className={`track-step-circle ${index <= currentStep ? 'track-step-active' : ''} ${order.status === 'Order Placed' && step === 'Order Placed' ? 'track-step-placed' : ''}`}>{index < currentStep ? '✓' : index + 1}</div>
                  <p className={`track-step-text ${index <= currentStep ? 'track-step-text-active' : ''}`}>{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div> : (
          <div className='track-progress-section'>
            <div className={`track-approval-message ${order.approvalStatus === 'waiting' ? 'track-waiting-message' : ''} ${order.approvalStatus === 'rejected' ? 'track-rejected-message' : ''}`}>
              <p className='track-box-title'>{getDisplayStatus()}</p>
              <p>{order.approvalStatus === 'waiting' ? 'Your order has been received and is waiting for admin approval.' : `Reason: ${order.rejectReason}`}</p>
            </div>
          </div>
        )}

        {/* Bottom detail area: items + delivery info */}
        <div className='track-details-grid'>
          {/* Items in order */}
          <div className='track-items-box'>
            <p className='track-box-title'>Items in this order</p>

            <div className='track-items-list'>
              {order.items.map((item, index) => (
                <div key={index} className='track-item'>
                  <img className='track-item-img' src={item.image[0]} alt='' />

                  <div className='track-item-info'>
                    <p className='track-item-name'>{item.name}</p>
                    <div className='track-item-meta'>
                      <p>{currency}{item.price}</p>
                      <p>Qty: {item.quantity}</p>
                      <p>Size: {item.size}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery information */}
          <div className='track-delivery-box'>
            <p className='track-box-title'>Delivery Information</p>

            <div className='track-delivery-info'>
              <p><span className='track-info-label'>Customer Name:</span> {order.address.firstName} {order.address.lastName}</p>
              <p><span className='track-info-label'>Address:</span> {order.address.street}, {order.address.city}, {order.address.state}, {order.address.country}, {order.address.zipcode}</p>
              <p><span className='track-info-label'>Phone Number:</span> {order.address.phone}</p>
              <p><span className='track-info-label'>Date:</span> {formatOrderDate(order.date)}</p>
              <p><span className='track-info-label'>Total:</span> {currency}{order.amount}</p>
            </div>

            <button type='button' onClick={() => window.location.href = '/orders'} className='track-back-btn'>Back To Orders</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrackOrder
