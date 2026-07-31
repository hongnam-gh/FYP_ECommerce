import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { assets } from '../../assets/assets'
import useAuth from '../../hooks/useAuth'
import { backendUrl, currency } from '../../constants/shopConfig'
import '../Cart/Cart.css'
import './Orders.css'

const Orders = () => {
  const { token } = useAuth()
  const [orderData, setOrderData] = useState([])
  const [cancelOrderId, setCancelOrderId] = useState('')
  const [isCanceling, setIsCanceling] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  const loadOrderData = async () => {
    try {
      if (!token) {
        setIsLoaded(true)
        return null
      }

      const response = await axios.post(backendUrl + '/api/order/userorders', {}, { headers: { token } })
      if (response.data.success) setOrderData(response.data.orders.reverse())
    } catch (error) {
      console.log(error)
    } finally {
      setIsLoaded(true)
    }
  }

  const openCancelModal = (orderId) => {
    setCancelOrderId(orderId)
  }

  const openCancelModalFromCard = (event, orderId) => {
    event.stopPropagation()
    openCancelModal(orderId)
  }

  const trackOrderFromButton = (event, orderId) => {
    event.stopPropagation()
    window.location.href = `/track-order/${orderId}`
  }

  const closeCancelModal = () => {
    if (isCanceling) return
    setCancelOrderId('')
  }

  const confirmCancelOrder = async () => {
    try {
      if (!cancelOrderId || isCanceling) return
      setIsCanceling(true)
      const response = await axios.post(backendUrl + '/api/order/cancel', { orderId: cancelOrderId }, { headers: { token } })

      if (response.data.success) {
        setCancelOrderId('')
        await loadOrderData()
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setIsCanceling(false)
    }
  }

  const canCancelOrder = (status) => {
    return ['Order Placed', 'Packing'].includes(status)
  }

  const getDisplayStatus = (order) => {
    if (order.approvalStatus === 'waiting') return 'Wait For Approve'
    if (order.approvalStatus === 'rejected') return 'Rejected'
    return order.status
  }

  const getStatusClass = (order) => {
    const status = getDisplayStatus(order)

    if (status === 'Order Placed') return 'order-status-placed'
    return `order-status-${order.approvalStatus || 'approved'}`
  }

  const canCancel = (order) => {
    if (order.approvalStatus === 'waiting') return true
    if (order.approvalStatus === 'rejected') return false
    return canCancelOrder(order.status)
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

  useEffect(() => {
    loadOrderData()
  }, [token])

  useEffect(() => {
    const refreshOrders = (event) => {
      const notification = event.detail?.notification
      if (!notification?.orderId) return
      loadOrderData()
    }

    window.addEventListener('order-status-updated', refreshOrders)
    return () => window.removeEventListener('order-status-updated', refreshOrders)
  }, [token])

  return (
    <div className={`orders-page ${isLoaded && orderData.length === 0 ? 'orders-page-empty' : ''}`}>
      {isLoaded && orderData.length === 0 ? (
        <div className='cart-empty-bg' style={{ backgroundImage: `linear-gradient(rgba(0,0,0,.25), rgba(0,0,0,.25)), url(${assets.dashboard_img})` }}>
          <div className='cart-empty-wrap'>
            <div className='cart-empty-card'>
              <div className='cart-empty-glow-one'></div>
              <div className='cart-empty-glow-two'></div>

              <div className='cart-empty-content'>
                <div className='cart-empty-icon'>🧾</div>
                <h2 className='cart-empty-title'>Nothing in the Cart?</h2>
                <p className='cart-empty-sad'>That's sad.</p>
                <p className='cart-empty-text'>Your Cart is looking empty as hell. Add something clean before checking out.</p>
                <button type='button' onClick={() => window.location.href = '/'} className='cart-empty-btn'>BACK TO SHOPPING</button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className='orders-header'>
            <div className='orders-title'>
              <h1 className="title"><span className="title-text">MY <span className="title-highlight">ORDERS</span></span><span className="title-line"></span></h1>
            </div>
            <p className='orders-count'>{orderData.length} order{orderData.length > 1 ? 's' : ''} found</p>
          </div>

          <div className='orders-list'>
            {orderData.map((order) => (
              <div key={order._id} onClick={() => window.location.href = `/track-order/${order._id}`} className='order-card'>
                <div className='order-top'>
                  <div>
                    <p className='order-label'>Order ID</p>
                    <p className='order-id'>{order._id}</p>
                  </div>

                  <div className='order-badges'>
                    <span className={`order-status-badge ${getStatusClass(order)}`}>{getDisplayStatus(order)}</span>
                  </div>
                </div>

                <div className='order-body'>
                  <div className='order-items'>
                    {order.items.map((item, index) => (
                      <div key={index} className='order-item-card'>
                        <div className='order-item-inner'>
                          <img className='order-item-img' src={item.image[0]} alt='' />

                          <div className='order-item-info'>
                            <p className='order-item-name'>{item.name}</p>
                            <p className='order-item-price'>{currency}{item.price}</p>

                            <div className='order-item-meta'>
                              <span className='order-item-pill'>Qty: {item.quantity}</span>
                              <span className='order-item-pill'>Size: {item.size}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className='order-summary'>
                    <div className='order-summary-info'>
                      <p className='order-summary-date'>Date: <span className='order-summary-value'>{formatOrderDate(order.date)}</span></p>
                      <p className='order-summary-items'>Items: <span className='order-summary-value'>{order.items.length}</span></p>
                      <p className='order-summary-payment'>Payment: <span>{order.paymentMethod}</span></p>
                      <p className='order-summary-total'>Total: <span>{currency}{order.amount}</span></p>
                    </div>

                    <div className='order-actions'>
                      {order.approvalStatus === 'rejected' ? (
                        <p className='order-reject-reason'>Reason: {order.rejectReason || 'No reason provided'}</p>
                      ) : (
                        <>
                          {canCancel(order) && <button type='button' onClick={(event) => openCancelModalFromCard(event, order._id)} className='order-cancel-btn'>Cancel Order</button>}
                          <button type='button' onClick={(event) => trackOrderFromButton(event, order._id)} className='order-track-btn'>Track Order</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {cancelOrderId && (
        <div className='order-modal-overlay'>
          <div className='order-modal'>
            <div className='order-modal-head'>
              <div className='order-modal-icon'>!</div>
              <h2 className='order-modal-title'>Cancel this order?</h2>
              <p className='order-modal-text'>This order will be canceled and reserved inventory will be returned.</p>
            </div>

            <div className='order-modal-actions'>
              <button type='button' onClick={closeCancelModal} disabled={isCanceling} className='order-keep-btn'>Keep Order</button>
              <button type='button' onClick={confirmCancelOrder} disabled={isCanceling} className='order-confirm-btn'>{isCanceling ? 'Canceling...' : 'Confirm Cancel'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Orders
