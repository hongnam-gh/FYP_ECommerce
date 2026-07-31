import React, { useEffect, useState } from 'react'
import CartTotal from '../../components/CartTotal'
import { assets } from '../../assets/assets'
import axios from 'axios'
import { toast } from 'react-toastify'
import useAuth from '../../hooks/useAuth'
import useCart from '../../hooks/useCart'
import useProducts from '../../hooks/useProducts'
import { backendUrl, currency } from '../../constants/shopConfig'
import './PlaceOrder.css'

const PlaceOrder = () => {
  const [method, setMethod] = useState('cod')
  const [savedAddresses, setSavedAddresses] = useState([])
  const [savedAddressId, setSavedAddressId] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isOrderRedirecting, setIsOrderRedirecting] = useState(false)
  const [cartPopupOpen, setCartPopupOpen] = useState(false)
  const [membership, setMembership] = useState(null)

  const { token } = useAuth()
  const { products } = useProducts()
  const { cartItems, setCartItems, getCartAmount } = useCart()

  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', street: '', city: '', state: '', zipcode: '', country: '', phone: '' })

  const hasCartItems = () => {
    if (!cartItems || typeof cartItems !== 'object') return false
    for (const productId in cartItems) {
      const sizeMap = cartItems[productId]
      if (!sizeMap || typeof sizeMap !== 'object') continue
      for (const size in sizeMap) if (sizeMap[size] > 0) return true
    }
    return false
  }

  useEffect(() => {
    if (isOrderRedirecting) return
    const savedToken = localStorage.getItem('token')

    if (!token && !savedToken) {
      window.location.href = '/login?redirect=/place-order'
      return
    }

    if (!hasCartItems()) {
      toast.error('Your bag is empty. Add something first.')
      window.location.href = '/cart'
    }
  }, [token, cartItems, isOrderRedirecting])

  const fetchSavedAddresses = async () => {
    if (!token) return

    try {
      const response = await axios.post(backendUrl + '/api/address/list', {}, { headers: { token } })
      if (response.data.success) setSavedAddresses(response.data.addresses.slice(0, 2))
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    fetchSavedAddresses()
  }, [token])

  useEffect(() => {
    const fetchMembership = async () => {
      if (!token) return

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
    const closePopupOnEsc = (event) => {
      if (event.key === 'Escape') setCartPopupOpen(false)
    }

    window.addEventListener('keydown', closePopupOnEsc)
    return () => window.removeEventListener('keydown', closePopupOnEsc)
  }, [])

  const onChangeHandler = (event) => {
    const { name, value } = event.target
    setFormData(data => ({ ...data, [name]: value }))

    if (savedAddressId) {
      setSavedAddressId('')
    }
  }

  const isFormComplete = () => Object.entries(formData).filter(([field]) => field !== 'firstName').every(([, value]) => String(value).trim() !== '')

  const saveDeliveryInformation = async () => {
    if (isSaving) return

    if (!isFormComplete()) return

    if (savedAddresses.length >= 2) return

    try {
      setIsSaving(true)
      const response = await axios.post(backendUrl + '/api/address/save', { address: formData }, { headers: { token } })

      if (response.data.success) {
        setSavedAddressId(response.data.address._id)
        await fetchSavedAddresses()
      }
    } catch (error) {
      console.log(error)
    } finally {
      setIsSaving(false)
    }
  }

  const deleteSavedAddress = async (event, addressId) => {
    event.stopPropagation()

    try {
      const response = await axios.post(backendUrl + '/api/address/delete', { addressId }, { headers: { token } })

      if (response.data.success) {
        if (savedAddressId === addressId) setSavedAddressId('')
        await fetchSavedAddresses()
      }
    } catch (error) {
      console.log(error)
    }
  }

  const applySavedAddress = (address) => {
    setFormData({ firstName: address.firstName || '', lastName: address.lastName || '', email: address.email || '', street: address.street || '', city: address.city || '', state: address.state || '', zipcode: address.zipcode || '', country: address.country || '', phone: address.phone || '' })
    setSavedAddressId(address._id)
  }

  const getOrderItems = () => {
    const orderItems = []

    for (const productId in cartItems) {
      const sizeMap = cartItems[productId]
      if (!sizeMap || typeof sizeMap !== 'object') continue

      for (const size in sizeMap) {
        if (sizeMap[size] > 0) {
          const productData = products.find(product => product._id === productId)
          if (productData) orderItems.push({ ...structuredClone(productData), size, quantity: sizeMap[size] })
        }
      }
    }

    return orderItems
  }

  const orderItemsPreview = getOrderItems()
  const subtotal = getCartAmount()
  const discountAmount = Number((subtotal * Number(membership?.discountPercent || 0) / 100).toFixed(2))
  const checkoutPricing = membership ? {
    rank: membership.rank || 'Standard',
    subtotal,
    discountPercent: Number(membership.discountPercent || 0),
    discountAmount,
    deliveryFee: Number(membership.deliveryFee),
    amount: Number((subtotal - discountAmount + Number(membership.deliveryFee)).toFixed(2))
  } : null

  const onSubmitHandler = async (event) => {
    event.preventDefault()

    if (!checkoutPricing) {
      toast.error('Membership pricing is still loading.')
      return
    }

    if (!hasCartItems()) {
      toast.error('Your bag is empty. Add something first.')
      window.location.href = '/cart'
      return
    }

    try {
      const orderItems = getOrderItems()

      if (orderItems.length === 0) {
        toast.error('Cart products are not loaded yet.')
        return
      }

      const orderData = { address: formData, items: orderItems, amount: checkoutPricing.amount }

      switch (method) {
        case 'cod': {
          const response = await axios.post(backendUrl + '/api/order/place', orderData, { headers: { token } })

          if (response.data.success) {
            setIsOrderRedirecting(true)
            setCartItems({})
            window.dispatchEvent(new Event('notifications-updated'))
            window.location.href = '/verify?method=cod'
          } else {
            toast.error(response.data.message)
          }

          break
        }

        case 'stripe': {
          const response = await axios.post(backendUrl + '/api/order/stripe', orderData, { headers: { token } })

          if (response.data.success) {
            setIsOrderRedirecting(true)
            localStorage.setItem('pendingCheckoutId', response.data.checkoutId)
            window.location.replace(response.data.session_url)
          } else {
            toast.error(response.data.message)
          }

          break
        }

        case 'momo': {
          const response = await axios.post(backendUrl + '/api/order/momo', orderData, { headers: { token } })

          if (response.data.success) {
            setIsOrderRedirecting(true)
            localStorage.setItem('pendingCheckoutId', response.data.checkoutId)
            window.location.href = `/verify?method=momo&checkoutId=${response.data.checkoutId}`
          } else {
            toast.error(response.data.message)
          }

          break
        }

        default:
          break
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const paymentCardClass = (name) => `place-order-payment-card place-order-payment-${name} ${method === name ? 'place-order-payment-active' : ''}`
  const radioClass = (name) => `place-order-radio ${method === name ? `place-order-radio-${name}` : ''}`
  const saveDisabled = isSaving || savedAddresses.length >= 2 || !isFormComplete()

  return (
    <form onSubmit={onSubmitHandler} style={{ backgroundImage: `url(${assets.cart_placeorder_theme})` }} className='place-order-page'>
      <div className='place-order-shell'>
        <div className='place-order-header'>
          <p>Secure Checkout</p>
          <h1>Complete Your Order</h1>
          <span>Review your delivery details and choose a payment method.</span>
        </div>

        <div className='place-order-container'>
        <div className='place-order-box place-order-delivery-box'>
          <div className='place-order-title'><h1 className='title'><span className='title-text'>DELIVERY <span className='title-highlight'>INFORMATION</span></span><span className='title-line'></span></h1></div>

          <div className='place-order-scroll'>
            <div className='place-order-fields'>
              <div className='place-order-row'>
                <input onChange={onChangeHandler} name='firstName' value={formData.firstName} className='place-order-input' type='text' placeholder='First Name (Optional)' />
                <input required onChange={onChangeHandler} name='lastName' value={formData.lastName} className='place-order-input' type='text' placeholder='Last Name' />
              </div>

              <input required onChange={onChangeHandler} name='email' value={formData.email} className='place-order-input' type='email' placeholder='Email Address' />
              <input required onChange={onChangeHandler} name='street' value={formData.street} className='place-order-input' type='text' placeholder='Street' />

              <div className='place-order-row'>
                <input required onChange={onChangeHandler} name='city' value={formData.city} className='place-order-input' type='text' placeholder='City' />
                <input required onChange={onChangeHandler} name='state' value={formData.state} className='place-order-input' type='text' placeholder='State' />
              </div>

              <div className='place-order-row'>
                <input required onChange={onChangeHandler} name='zipcode' value={formData.zipcode} className='place-order-input' type='number' placeholder='Zipcode' />
                <input required onChange={onChangeHandler} name='country' value={formData.country} className='place-order-input' type='text' placeholder='Country' />
              </div>

              <input required onChange={onChangeHandler} name='phone' value={formData.phone} className='place-order-input' type='number' placeholder='Phone Number' />

              <div className='place-order-save-card'>
                <div className='place-order-save-head'>
                  <div>
                    <p className='place-order-save-title'>Save delivery information</p>
                    <p className='place-order-save-text'>Store this address for faster checkout next time.</p>
                  </div>
                  <span className='place-order-save-count'>{savedAddresses.length}/2</span>
                </div>

                <button type='button' style={!saveDisabled ? { backgroundImage: `url(${assets.place_order_button_theme})` } : undefined} onClick={saveDeliveryInformation} disabled={saveDisabled} className={`place-order-save-btn ${saveDisabled ? 'place-order-save-btn-disabled' : 'place-order-save-btn-active'}`}>{isSaving ? 'Saving...' : 'Save Information'}</button>
              </div>

              {savedAddresses.length > 0 && (
                <div className='place-order-saved-section'>
                  <div className='place-order-saved-head'>
                    <p className='place-order-saved-title'>Saved delivery information</p>
                    <p className='place-order-saved-help'>Click card to apply</p>
                  </div>

                  <div className='place-order-saved-list'>
                    {savedAddresses.map((address, index) => (
                      <div key={address._id} onClick={() => applySavedAddress(address)} className={`place-order-address-card ${savedAddressId === address._id ? 'place-order-address-card-active' : ''}`}>
                        <div className='place-order-address-bar'></div>

                        <div className='place-order-address-inner'>
                          <div className='place-order-address-info'>
                            <div className='place-order-address-name-row'>
                              <span className='place-order-address-number'>{index + 1}</span>
                              <p className='place-order-address-name'>{address.firstName} {address.lastName}</p>
                            </div>

                            <p className='place-order-address-detail'>{address.street}, {address.city}, {address.state}</p>
                            <p className='place-order-address-small'>{address.country} • {address.zipcode}</p>
                            <p className='place-order-address-small'>{address.phone}</p>
                          </div>

                          <button type='button' onClick={(event) => deleteSavedAddress(event, address._id)} className='place-order-delete-btn'>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className='place-order-right'>
          <div onClick={() => setCartPopupOpen(true)} className='place-order-box place-order-cart-total-box'>
            <div className='place-order-product-preview'>
              <div>
                <p>Order Summary</p>
                <span>{orderItemsPreview.length} {orderItemsPreview.length === 1 ? 'product' : 'products'}</span>
              </div>
              <div className='place-order-product-images'>
                {orderItemsPreview.slice(0, 3).map(item => <img key={`${item._id}-${item.size}`} src={item.image?.[0]} alt={item.name} />)}
                {orderItemsPreview.length > 3 && <span>+{orderItemsPreview.length - 3}</span>}
              </div>
            </div>
            <CartTotal pricing={checkoutPricing} />
          </div>

          <div className='place-order-box place-order-payment-box'>
            <h1 className='title'><span className='title-text'>PAYMENT <span className='title-highlight'>METHOD</span></span><span className='title-line'></span></h1>

            <div className='place-order-payment-list'>
              <div onClick={() => setMethod('momo')} className={paymentCardClass('momo')}>
                <span className='place-order-popular'>Popular</span>
                <div className='place-order-momo-logo'><div className='place-order-momo-text'><div>Mo</div><div>Mo</div></div></div>
                <div className='place-order-payment-info'><p className='place-order-payment-title place-order-payment-title-momo'>MoMo Payment</p><p className='place-order-payment-desc'>Pay fast with MoMo wallet</p></div>
                <p className={radioClass('momo')}></p>
              </div>

              <div onClick={() => setMethod('stripe')} className={paymentCardClass('stripe')}>
                <div className='place-order-stripe-logo'><img className='place-order-stripe-img' src={assets.stripe_logo} alt='Stripe' /></div>
                <div className='place-order-payment-info'><p className='place-order-payment-title place-order-payment-title-stripe'>Stripe Payment</p><p className='place-order-payment-desc'>Pay by credit card securely</p></div>
                <p className={radioClass('stripe')}></p>
              </div>

              <div onClick={() => setMethod('cod')} className={paymentCardClass('cod')}>
                <div className='place-order-cod-logo'><span>💵</span></div>
                <div className='place-order-payment-info'><p className='place-order-payment-title place-order-payment-title-cod'>Cash On Delivery</p><p className='place-order-payment-desc'>Pay when your order arrives</p></div>
                <p className={radioClass('cod')}></p>
              </div>
            </div>

            {method === 'momo' && <div className='place-order-payment-note place-order-note-momo'><p className='place-order-note-title-momo'>MoMo checkout selected</p><p>You will be redirected to verify your phone and OTP after placing the order.</p></div>}
            {method === 'stripe' && <div className='place-order-payment-note place-order-note-stripe'><p className='place-order-note-title-stripe'>Stripe checkout selected</p><p>You will be redirected to Stripe secure checkout after placing the order.</p></div>}
            {method === 'cod' && <div className='place-order-payment-note place-order-note-cod'><p className='place-order-note-title-cod'>Cash on delivery selected</p><p>Your order will be placed immediately and paid when it is delivered to you.</p></div>}

            <div className='place-order-btn-wrap'><button type='submit' style={{ backgroundImage: `url(${assets.place_order_button_theme})` }} className='place-order-btn'>PLACE MY ORDER</button></div>
          </div>
        </div>
      </div>
      </div>

      {cartPopupOpen && (
        <div onClick={() => setCartPopupOpen(false)} className='place-order-cart-popup-overlay'>
          <div onClick={(event) => event.stopPropagation()} className='place-order-cart-popup'>
            <div className='place-order-cart-popup-head'>
              <div>
                <p>Order Preview</p>
                <h2>Your Products</h2>
              </div>
              <button type='button' onClick={() => setCartPopupOpen(false)}>×</button>
            </div>

            <div className='place-order-cart-popup-list'>
              {orderItemsPreview.map((item) => (
                <div key={`${item._id}-${item.size}`} className='place-order-cart-popup-item'>
                  <img src={item.image?.[0]} alt={item.name} />
                  <div className='place-order-cart-popup-info'>
                    <p>{item.name}</p>
                    <span>Size: {item.size} · Quantity: {item.quantity}</span>
                  </div>
                  <b>{currency}{Number(item.price || 0) * item.quantity}</b>
                </div>
              ))}
            </div>

            <div className='place-order-cart-popup-total'>
              <span>{checkoutPricing.rank} Member Total</span>
              <b>{currency}{checkoutPricing.amount}</b>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}

export default PlaceOrder
