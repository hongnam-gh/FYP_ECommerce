import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { assets } from '../../assets/assets'
import axios from 'axios'
import { backendUrl } from '../../constants/shopConfig'
import './ForgotPassword.css'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmitHandler = async (event) => {
    event.preventDefault()

    try {
      setLoading(true)
      const response = await axios.post(backendUrl + '/api/user/forgot-password', { email })

      if (response.data.success) {
        toast.success(response.data.message)
        setEmail('')
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='forgot-page' style={{ backgroundImage: `linear-gradient(rgba(0,0,0,.25), rgba(0,0,0,.25)), url(${assets.dashboard_img})` }}>
      <form onSubmit={onSubmitHandler} className='forgot-form'>
        <div className='forgot-header'>
          <p className='prata-regular forgot-title'>Forgot Password</p>
          <div className='forgot-line'></div>
          <p className='forgot-subtitle'>Enter your email to reset your password</p>
        </div>

        <div className='forgot-fields'>
          <input onChange={(e) => setEmail(e.target.value)} value={email} type='email' className='forgot-input' placeholder='Email' required />
        </div>

        <div className='forgot-links'>
          <p onClick={() => window.location.href = '/signup'} className='forgot-link'>Create Account</p>
          <p onClick={() => window.location.href = '/login'} className='forgot-link forgot-link-login'>Back to Login</p>
        </div>

        <button disabled={loading} type='submit' className='forgot-btn'>{loading ? 'Sending...' : 'Send Reset Link'}</button>

        <div className='forgot-divider'>
          <div className='forgot-divider-line'></div>
          <p className='forgot-divider-text'>ACCOUNT RECOVERY</p>
          <div className='forgot-divider-line'></div>
        </div>

        <p className='forgot-note'>We will help you recover access to your Distressed account.</p>
      </form>
    </div>
  )
}

export default ForgotPassword
