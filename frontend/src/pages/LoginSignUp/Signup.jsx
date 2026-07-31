import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { assets } from '../../assets/assets'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import useAuth from '../../hooks/useAuth'
import useSocialAuth from '../../hooks/useSocialAuth'
import { mergeGuestCart } from '../../hooks/useCart'
import { backendUrl } from '../../constants/shopConfig'
import { queueAuthSuccessToast } from '../../utils/authToast'
import './Signup.css'

const Signup = () => {
  const { token, setToken } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { loginGoogle, loginFacebook, socialLoading } = useSocialAuth()

  const onSubmitHandler = async (event) => {
    event.preventDefault()

    try {
      const response = await axios.post(backendUrl + '/api/user/register', { name, email, password })

      if (response.data.success) {
        await mergeGuestCart(response.data.token)
        queueAuthSuccessToast('Account created successfully. Welcome to Distressed!')
        setToken(response.data.token)
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  useEffect(() => {
    if (token) window.location.href = '/'
  }, [token])

  return (
    <div className='signup-page' style={{ backgroundImage: `linear-gradient(rgba(0,0,0,.25), rgba(0,0,0,.25)), url(${assets.dashboard_img})` }}>
      <form onSubmit={onSubmitHandler} className='signup-form'>
        <div className='signup-header'>
          <p className='prata-regular signup-title'>Sign Up</p>
          <div className='signup-line'></div>
          <p className='signup-subtitle'>Create your Distressed account</p>
        </div>

        <div className='signup-fields'>
          <input onChange={(e) => setName(e.target.value)} value={name} type='text' className='signup-input' placeholder='Name' required />
          <input onChange={(e) => setEmail(e.target.value)} value={email} type='email' className='signup-input' placeholder='Email' required />

          <div className='signup-input-box'>
            <input onChange={(e) => setPassword(e.target.value)} value={password} type={showPassword ? 'text' : 'password'} className='signup-input signup-password-input' placeholder='Password' required />
            <button type='button' onClick={() => setShowPassword(!showPassword)} className='signup-eye-btn'>{showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}</button>
          </div>
        </div>

        <div className='signup-links'>
          <p onClick={() => window.location.href = '/forgot-password'} className='signup-link'>Forgot Password?</p>
          <p onClick={() => window.location.href = '/login'} className='signup-link signup-link-login'>Log In</p>
        </div>

        <button type='submit' className='signup-btn'>Sign Up</button>

        <div className='signup-divider'>
          <div className='signup-divider-line'></div>
          <p className='signup-divider-text'>OR</p>
          <div className='signup-divider-line'></div>
        </div>

        <div className='signup-social-actions'>
          <button type='button' onClick={loginGoogle} disabled={socialLoading !== ''} className='signup-social-btn signup-google-btn'><img src={assets.google_icon} alt='' /><span>{socialLoading === 'google' ? 'Connecting...' : 'Log In Google'}</span></button>
          <button type='button' onClick={loginFacebook} disabled={socialLoading !== ''} className='signup-social-btn signup-facebook-btn'><img src={assets.facebook_icon} alt='' /><span>{socialLoading === 'facebook' ? 'Connecting...' : 'Log In Facebook'}</span></button>
        </div>

        <p className='signup-note'>By continuing, you agree to Distressed account access and checkout security.</p>
      </form>
    </div>
  )
}

export default Signup
