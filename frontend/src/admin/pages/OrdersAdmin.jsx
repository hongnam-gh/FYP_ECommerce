import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { FiCalendar, FiMail, FiMapPin, FiPhone, FiSearch } from 'react-icons/fi'
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

const OrdersAdmin = ({ token, clearOrderAlert, socket }) => {
  const [orders, setOrders] = useState([])
  const [search, setSearch] = useState('')

  const filteredOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return orders

    return orders.filter((order) => {
      return getCustomerName(order).toLowerCase().includes(keyword) || String(order._id).toLowerCase().includes(keyword)
    })
  }, [orders, search])

  const getLatestOrderDate = (orderList) => {
    if (!orderList || orderList.length === 0) return 0
    return Math.max(...orderList.map((order) => Number(order.date || 0)))
  }

  const fetchAllOrders = async () => {
    if (!token) return null

    try {
      const response = await axios.post(backendUrl + '/api/order/list', {}, { headers: { token } })

      if (response.data.success) {
        setOrders(response.data.orders)

        const latestOrderDate = getLatestOrderDate(response.data.orders)
        clearOrderAlert && clearOrderAlert(latestOrderDate)
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const statusHandler = async (event, orderId) => {
    try {
      const response = await axios.post(backendUrl + '/api/order/status', { orderId, status: event.target.value }, { headers: { token } })
      if (response.data.success) await fetchAllOrders()
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  useEffect(() => {
    fetchAllOrders()
  }, [token])

  useEffect(() => {
    if (!socket) return

    socket.on('admin-orders:update', fetchAllOrders)
    return () => socket.off('admin-orders:update', fetchAllOrders)
  }, [socket, token])

  return (
    <div className='admin-orders-page'>
      
      <div className='admin-orders-header'>
        <div>
          <h1 className='admin-orders-title'>Orders Details</h1>
          <p className='admin-orders-subtitle'>Track every customer order, payment state, delivery address, and fulfillment status.</p>
        </div>

        <label className='admin-orders-search'><FiSearch /><input value={search} onChange={(event) => setSearch(event.target.value)} type='text' placeholder='Search customer or order ID' /></label>
      </div>

      {/* Orders list */}
      <div className='admin-orders-list'>
        {filteredOrders.map((order) => (
          <article className='admin-order-detail-card' key={order._id}>
            <header className='admin-order-detail-head' style={{ backgroundImage: getOrderHeaderGradient(order._id) }}>
              <div>
                <small>Order #{String(order._id).slice(-8).toUpperCase()}</small>
                <p><FiCalendar /> {formatOrderDateTime(order.date)}</p>
              </div>

              <div className='admin-order-detail-status'>
                <div className='admin-order-head-info'>
                  <p><span>Membership Rank</span><b style={{ color: membershipRankColors[order.membershipRank] || membershipRankColors.Standard }}>{order.membershipRank || 'Standard'}</b></p>
                  <p><span>Payment Status</span><b className={order.payment ? 'paid' : 'pending'}>{order.payment ? 'Paid' : 'Payment Pending'}</b></p>
                  <p><span>Payment Method</span><b>{order.paymentMethod}</b></p>
                  <p><span>Order Total</span><b>{formatMoney(order.amount)}</b></p>
                </div>
                <select onChange={(event) => statusHandler(event, order._id)} value={order.status} className='admin-order-select'>
                  <option value='Order Placed'>Order Placed</option>
                  <option value='Packing'>Packing</option>
                  <option value='Shipped'>Shipped</option>
                  <option value='Out for delivery'>Out for delivery</option>
                  <option value='Delivered'>Delivered</option>
                </select>
              </div>
            </header>

            <div className='admin-order-detail-body'>
              <section className='admin-order-products'>
                <div className='admin-order-section-title'><div><small>Products</small><h2>Order Items</h2></div><span>{order.items.reduce((total, item) => total + Number(item.quantity || 0), 0)} units</span></div>

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
          </article>
        ))}

        {filteredOrders.length === 0 && <p className='admin-empty-orders'>{search ? 'No matching orders found.' : 'No orders found.'}</p>}
      </div>
    </div>
  )
}

export default OrdersAdmin
