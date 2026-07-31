import React, { useCallback, useEffect, useState } from 'react'
import { assets } from '../../assets/assets'
import axios from 'axios'
import { toast } from 'react-toastify'
import useAuth from '../../hooks/useAuth'
import useCart from '../../hooks/useCart'
import useProducts from '../../hooks/useProducts'
import { backendUrl, currency } from '../../constants/shopConfig'
import './Cart.css'

const Cart = () => {
  const { token } = useAuth()
  const { products } = useProducts()
  const { cartItems, updateQuantity, getCartAmount } = useCart()
  const [cartData, setCartData] = useState([])
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [stockData, setStockData] = useState({})
  const [stockLoaded, setStockLoaded] = useState(false)
  const [membership, setMembership] = useState(null)

  useEffect(() => {
    const fetchMembership = async () => {
      if (!token) {
        setMembership(null)
        return
      }

      try {
        const response = await axios.post(backendUrl + '/api/membership/profile', {}, { headers: { token } })
        if (response.data.success) setMembership(response.data.membership)
      } catch (error) {
        console.log(error)
      }
    }

    fetchMembership()
  }, [token])

  useEffect(() => {
    if (products.length > 0) {
      const tempData = []

      for (const items in cartItems) {
        for (const item in cartItems[items]) {
          if (cartItems[items][item] > 0) tempData.push({ _id: items, size: item, quantity: cartItems[items][item] })
        }
      }

      setCartData(tempData)
    }
  }, [cartItems, products])

  const fetchCartStock = useCallback(async () => {
    try {
      const tempStock = {}

      for (const item of cartData) {
        if (!tempStock[item._id]) {
          const response = await axios.post(backendUrl + '/api/inventory/single-public', { productId: item._id })
          tempStock[item._id] = response.data.success ? response.data.inventory?.stock || {} : {}
        }
      }

      setStockData(tempStock)
      setStockLoaded(true)
      return tempStock
    } catch (error) {
      console.log(error)
      setStockData({})
      setStockLoaded(false)
      return null
    }
  }, [cartData])

  useEffect(() => {
    if (cartData.length > 0) {
      fetchCartStock()
    } else {
      setStockData({})
      setStockLoaded(false)
    }
  }, [cartData.length, fetchCartStock])

  useEffect(() => {
    const refreshCartStock = () => {
      if (cartData.length > 0) fetchCartStock()
    }

    window.addEventListener('focus', refreshCartStock)
    window.addEventListener('pageshow', refreshCartStock)

    return () => {
      window.removeEventListener('focus', refreshCartStock)
      window.removeEventListener('pageshow', refreshCartStock)
    }
  }, [cartData.length, fetchCartStock])

  const getSizeStock = (itemId, size) => {
    return Number(stockData?.[itemId]?.[size] || 0)
  }

  const hasStockIssue = (stock) => cartData.some((item) => item.quantity > Number(stock?.[item._id]?.[item.size] || 0))
  const hasUnavailableItems = stockLoaded && hasStockIssue(stockData)

  const proceedToPayment = async () => {
    if (cartData.length === 0) return

    if (!token) {
      setShowLoginModal(true)
      return
    }

    const latestStock = await fetchCartStock()

    if (!latestStock) {
      toast.error('Unable to verify product stock. Please try again.')
      return
    }

    if (hasStockIssue(latestStock)) {
      toast.error('Some products in your cart are no longer available.')
      return
    }

    window.location.href = '/place-order'
  }

  const subtotal = getCartAmount()
  const deliveryFee = membership?.deliveryFee
  const discountAmount = Number((subtotal * Number(membership?.discountPercent || 0) / 100).toFixed(2))
  const total = deliveryFee === undefined ? null : Number((subtotal - discountAmount + deliveryFee).toFixed(2))

  return (
    <>
      {showLoginModal && (
        <div className='cart-modal-overlay'>
          <div className='cart-modal'>
            <button type='button' onClick={() => setShowLoginModal(false)} className='cart-modal-close'>✕</button>

            <div className='cart-modal-icon'>
              <span>🔒</span>
            </div>

            <div className='cart-modal-content'>
              <h2 className='cart-modal-title'>Login Required</h2>
              <p className='cart-modal-text'>You need to login before proceeding to payment. Your cart is safe, chill bro.</p>
            </div>

            <div className='cart-modal-actions'>
              <button type='button' onClick={() => window.location.href = '/login?redirect=/place-order'} className='cart-modal-login'>LOGIN NOW</button>
              <button type='button' onClick={() => setShowLoginModal(false)} className='cart-modal-continue'>CONTINUE SHOPPING</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ backgroundImage: `url(${assets.cart_placeorder_theme})` }} className={`cart-page ${cartData.length > 0 ? 'cart-page-has-items' : ''}`}>
        {cartData.length === 0 ? (
          <div className='cart-empty-bg'>
            <div className='cart-empty-wrap'>
              <div className='cart-empty-card'>
                <div className='cart-empty-glow-one'></div>
                <div className='cart-empty-glow-two'></div>

                <div className='cart-empty-content'>
                  <div className='cart-empty-icon'>🛍️</div>
                  <h2 className='cart-empty-title'>Nothing in the Cart?</h2>
                  <p className='cart-empty-sad'>That's sad.</p>
                  <p className='cart-empty-text'>Your Cart is looking empty as hell. Add something clean before checking out.</p>
                  <button type='button' onClick={() => window.location.href = '/'} className='cart-empty-btn'>BACK TO SHOPPING</button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className='cart-container'>
            <div className='cart-table'>
              <div className='cart-table-head'>
                <p className='cart-table-head-left'>Product Name</p>
                <p>Price</p>
                <p>Quantity</p>
                <p>Total Price</p>
                <p></p>
              </div>

              <div className='cart-list'>
                {cartData.map((item, index) => {
                  const productData = products.find((product) => product._id === item._id)

                  if (!productData) return null

                  const totalPrice = productData.price * item.quantity
                  const maxStock = getSizeStock(item._id, item.size)
                  const isMaxStock = item.quantity >= maxStock
                  const hasItemStockIssue = stockLoaded && item.quantity > maxStock
                  const stockMessage = maxStock <= 0 ? 'Out of Stock' : `Only ${maxStock} available`

                  return (
                    <div key={index} className={`cart-item ${hasItemStockIssue ? 'cart-item-unavailable' : ''}`}>
                      <div className='cart-mobile-row'>
                        <div className='cart-mobile-info'>
                          <img className='cart-img' src={productData.image[0]} alt='' />

                          <div>
                            <p className='cart-mobile-name'>{productData.name}</p>
                            <p className='cart-mobile-size'>Size: {item.size}</p>
                            {hasItemStockIssue && <p className='cart-stock-warning'>{stockMessage}</p>}
                            <p className='cart-mobile-price'>{currency}{productData.price}</p>
                            <p className='cart-mobile-total'>Total Price: {currency}{totalPrice}</p>
                          </div>
                        </div>

                        <div className='cart-mobile-actions'>
                          <button type='button' onClick={() => updateQuantity(item._id, item.size, 0)} className='cart-remove-mobile'>
                            <img className='cart-bin-mobile' src={assets.bin_icon} alt='' />
                          </button>

                          <div className='cart-qty'>
                            <button type='button' onClick={() => updateQuantity(item._id, item.size, Math.max(item.quantity - 1, 1), maxStock)} className='cart-qty-btn'>-</button>
                            <span className='cart-qty-value'>{item.quantity}</span>
                            <button type='button' disabled={isMaxStock} onClick={() => updateQuantity(item._id, item.size, item.quantity + 1, maxStock)} className={`cart-qty-btn ${isMaxStock ? 'cart-qty-btn-disabled' : ''}`}>+</button>
                          </div>
                        </div>
                      </div>

                      <div className='cart-desktop-product'>
                        <img className='cart-img' src={productData.image[0]} alt='' />
                        <div>
                          <p className='cart-desktop-name'>{productData.name}</p>
                          <p className='cart-desktop-size'>Size: {item.size}</p>
                          {hasItemStockIssue && <p className='cart-stock-warning'>{stockMessage}</p>}
                        </div>
                      </div>

                      <div className='cart-desktop-price'>{currency}{productData.price}</div>

                      <div className='cart-desktop-qty'>
                        <div className='cart-qty'>
                          <button type='button' onClick={() => updateQuantity(item._id, item.size, Math.max(item.quantity - 1, 1), maxStock)} className='cart-qty-btn'>-</button>
                          <span className='cart-qty-value'>{item.quantity}</span>
                          <button type='button' disabled={isMaxStock} onClick={() => updateQuantity(item._id, item.size, item.quantity + 1, maxStock)} className={`cart-qty-btn ${isMaxStock ? 'cart-qty-btn-disabled' : ''}`}>+</button>
                        </div>
                      </div>

                      <div className='cart-desktop-total'>{currency}{totalPrice}</div>

                      <div className='cart-desktop-remove'>
                        <button type='button' onClick={() => updateQuantity(item._id, item.size, 0)} className='cart-remove-desktop'>
                          <img className='cart-bin-desktop' src={assets.bin_icon} alt='' />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className='cart-total-bar'>
              <div className='cart-total-inner'>
                <div>
                  <p className='cart-total-label'>Cart Totals</p>
                  <p className='cart-total-help'>Review your total before checkout.</p>
                  {hasUnavailableItems && <p className='cart-stock-notice'>Remove or adjust unavailable products before payment.</p>}
                </div>

                <div className='cart-total-grid'>
                  <div className='cart-total-box'>
                    <p className='cart-total-small'>Subtotal</p>
                    <p className='cart-total-money'>{currency}{subtotal}</p>
                  </div>

                  <div className='cart-total-box'>
                    <p className='cart-total-small'>Shipping</p>
                    <p className='cart-total-money'>{deliveryFee === undefined ? 'Login to view' : deliveryFee === 0 ? 'Free' : `${currency}${deliveryFee}`}</p>
                  </div>

                  <div className='cart-total-box cart-total-box-black'>
                    <p className='cart-total-small'>Total</p>
                    <p className='cart-total-money'>{total === null ? `${currency}${subtotal}` : `${currency}${total}`}</p>
                  </div>
                </div>

                <button disabled={hasUnavailableItems} onClick={proceedToPayment} className={`cart-pay-btn ${hasUnavailableItems ? 'cart-pay-btn-disabled' : ''}`}>
                  <span className='cart-pay-shine'></span>
                  <span className='cart-pay-text'>PROCEED TO PAYMENT</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default Cart
