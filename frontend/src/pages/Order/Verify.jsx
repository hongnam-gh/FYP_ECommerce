import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import axios from 'axios'
import { assets } from '../../assets/assets'
import useAuth from '../../hooks/useAuth'
import useCart from '../../hooks/useCart'
import { backendUrl } from '../../constants/shopConfig'
import './Verify.css'

const Verify = () => {
  const { token } = useAuth()
  const { setCartItems } = useCart()
  const searchParams = new URLSearchParams(window.location.search)

  const success = searchParams.get('success')
  const sessionId = searchParams.get('session_id')
  const checkoutId = searchParams.get('checkoutId')
  const method = searchParams.get('method')

  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [showThankYou, setShowThankYou] = useState(false)

  const cancelPendingCheckout = async (redirectPath) => {
    let shouldClearCheckout = false

    try {
      if (token && checkoutId) {
        const response = await axios.post(backendUrl + '/api/pending-checkout/cancel', { checkoutId }, { headers: { token } })
        shouldClearCheckout = response.data.success || response.data.message === 'Checkout not found'
      }
    } catch (error) {
      console.log(error)
    } finally {
      if (shouldClearCheckout) localStorage.removeItem('pendingCheckoutId')
      window.location.href = redirectPath
    }
  }

  const showSuccessThenRedirect = () => {
    setCartItems({})
    localStorage.setItem('cartItems', JSON.stringify({}))
    localStorage.removeItem('pendingCheckoutId')
    window.dispatchEvent(new Event('notifications-updated'))
    setShowThankYou(true)

    setTimeout(() => {
      setShowThankYou(false)
      window.location.href = '/orders'
    }, 2000)
  }

  const verifyPayment = async () => {
    try {
      if (!token) return null

      if (method === 'momo') {
        const phoneRegex = /^[0-9]{10}$/
        const otpRegex = /^[0-9]{6}$/

        if (!checkoutId) {
          toast.error('Checkout not found')
          return null
        }

        if (!phoneRegex.test(phone)) {
          toast.error('Phone number must be exactly 10 digits')
          return null
        }

        if (!otpRegex.test(otp)) {
          toast.error('OTP must be exactly 6 digits')
          return null
        }

        const response = await axios.post(backendUrl + '/api/order/verifyMomo', { checkoutId, phone, otp }, { headers: { token } })

        if (response.data.success) {
          showSuccessThenRedirect()
        } else {
          toast.error(response.data.message)
        }

        return null
      }

      if (success !== 'true' || !sessionId) {
        if (checkoutId) await cancelPendingCheckout('/cart')
        else window.location.href = '/cart'
        return null
      }

      const response = await axios.post(backendUrl + '/api/order/verifyStripe', { session_id: sessionId }, { headers: { token } })

      if (response.data.success) {
        showSuccessThenRedirect()
      } else {
        toast.error(response.data.message || 'Payment verification failed')
        window.location.href = '/cart'
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
      window.location.href = '/cart'
    }
  }

  useEffect(() => {
    if (method === 'cod') {
      showSuccessThenRedirect()
      return
    }

    if (method === 'momo') return
    if (token) verifyPayment()
  }, [token])

  useEffect(() => {
    if (!token || !checkoutId || method !== 'momo') return

    const cancelOnPageHide = () => {
      if (localStorage.getItem('pendingCheckoutId') !== checkoutId) return

      fetch(backendUrl + '/api/pending-checkout/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', token },
        body: JSON.stringify({ checkoutId }),
        keepalive: true
      })
    }

    window.addEventListener('pagehide', cancelOnPageHide)
    return () => window.removeEventListener('pagehide', cancelOnPageHide)
  }, [token, checkoutId, method])

  if (showThankYou) {
    return (
      
      <div className='verify-success-overlay'>
        <div className='verify-success-card'>
          <div className='verify-success-icon-wrap'>
            <div className='verify-success-icon'>✓</div>
          </div>

          <h2 className='verify-success-title'>Thank you for your purchase.</h2>
          <p className='verify-success-text'>Your order is waiting for admin approval.</p>

          <div className='verify-progress-wrap'>
            <div className='verify-progress-bar'></div>
          </div>
        </div>
      </div>
    )
  }

  if (method === 'momo') {
    return (
      
      <div className='verify-momo-page' style={{ backgroundImage: `linear-gradient(rgba(0,0,0,.35), rgba(0,0,0,.35)), url(${assets.dashboard_img})` }}>
        <div className='verify-momo-card'>

          
          <div className='verify-momo-brand'>
            <div className='verify-momo-brand-light'></div>
            <div className='verify-momo-brand-glow'></div>
            <div className='verify-momo-brand-dot'></div>
            <div className='verify-momo-brand-bg' style={{ backgroundImage: "url('/your-momo-bg.jpg')" }}></div>

            <div className='verify-momo-brand-content'>
              <div>
                <div className='verify-momo-brand-logo'>
                  <div className='verify-momo-logo-text'>
                    <div>Mo</div>
                    <div>Mo</div>
                  </div>
                </div>

                <h2 className='verify-momo-brand-title'>Secure MoMo Checkout</h2>
                <p className='verify-momo-brand-text'>Enter your phone number and OTP to complete your payment.</p>
              </div>

              <div className='verify-momo-demo-box'>
                <p className='verify-momo-demo-title'>Demo payment mode</p>
                <p className='verify-momo-demo-text'>Any 6-digit OTP will be accepted.</p>
              </div>
            </div>
          </div>

          
          <div className='verify-momo-form-panel'>
            <button type='button' onClick={() => cancelPendingCheckout('/cart')} className='verify-momo-close'>✕</button>

            <div className='verify-momo-header'>
              <div className='verify-momo-mobile-logo' style={{ backgroundImage: `linear-gradient(rgba(0,0,0,.25), rgba(0,0,0,.25)), url(${assets.dashboard_img})` }}>
                <div className='verify-momo-mobile-logo-text'>
                  <div>Mo</div>
                  <div>Mo</div>
                </div>
              </div>

              <p className='verify-momo-label'>MoMo Payment</p>
              <h2 className='verify-momo-title'>Confirm your payment</h2>
              <p className='verify-momo-subtitle'>Phone number must be 10 digits. OTP must be 6 digits.</p>
            </div>

            <div className='verify-momo-fields'>
              {/* Phone input */}
              <div>
                <label className='verify-field-label'>Phone Number</label>
                <input type='text' placeholder='0123456789' value={phone} maxLength={10} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} className='verify-momo-input' />
              </div>

              {/* OTP input */}
              <div>
                <label className='verify-field-label'>OTP Code</label>
                <input type='text' placeholder='123456' value={otp} maxLength={6} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} className='verify-momo-input verify-momo-otp' />
              </div>

              {/* Confirm payment button */}
              <button type='button' onClick={verifyPayment} className='verify-momo-confirm'>CONFIRM MOMO PAYMENT</button>

              {/* Back to place order */}
              <button type='button' onClick={() => cancelPendingCheckout('/place-order')} className='verify-momo-back'>Back to Place Order</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    
    <div className='verify-loading-page'>
      <div className='verify-spinner'></div>
    </div>
  )
}

export default Verify
