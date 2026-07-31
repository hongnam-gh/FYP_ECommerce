import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { assets } from '../../assets/assets'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import useAuth from '../../hooks/useAuth'
import useSocialAuth from '../../hooks/useSocialAuth'
import { mergeGuestCart } from '../../hooks/useCart'
import { backendUrl } from '../../constants/shopConfig'
import { consumeAuthSuccessToast, queueAuthSuccessToast } from '../../utils/authToast'
import './Login.css'

const Login = () => {
  const { token, setToken } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { loginGoogle, loginFacebook, socialLoading } = useSocialAuth()
  const redirectPath = new URLSearchParams(window.location.search).get('redirect') || '/'

  const onSubmitHandler = async (event) => {
    event.preventDefault()

    try {
      const response = await axios.post(backendUrl + '/api/user/login', { email, password })

      if (response.data.success) {
        await mergeGuestCart(response.data.token)
        queueAuthSuccessToast('Login successful. Welcome back!')
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
    if (token) window.location.href = redirectPath
  }, [token, redirectPath])

  useEffect(() => {
    const message = consumeAuthSuccessToast()
    if (message) toast.success(message)
  }, [])

  return (
    <div className='login-page' style={{ backgroundImage: `linear-gradient(rgba(0,0,0,.25), rgba(0,0,0,.25)), url(${assets.dashboard_img})` }}>
      <form onSubmit={onSubmitHandler} className='login-form'>
        <div className='login-header'>
          <p className='prata-regular login-title'>Login</p>
          <div className='login-line'></div>
          <p className='login-subtitle'>Welcome back to Distressed</p>
        </div>

        <div className='login-fields'>
          <input onChange={(e) => setEmail(e.target.value)} value={email} type='email' className='login-input' placeholder='Email' required />

          <div className='login-input-box'>
            <input onChange={(e) => setPassword(e.target.value)} value={password} type={showPassword ? 'text' : 'password'} className='login-input login-password-input' placeholder='Password' required />
            <button type='button' onClick={() => setShowPassword(!showPassword)} className='login-eye-btn'>{showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}</button>
          </div>
        </div>

        <div className='login-links'>
          <p onClick={() => window.location.href = '/forgot-password'} className='login-link'>Forgot your password?</p>
          <p onClick={() => window.location.href = '/signup'} className='login-link login-link-create'>Create Account</p>
        </div>

        <button type='submit' className='login-btn'>Log In</button>

        <div className='login-divider'>
          <div className='login-divider-line'></div>
          <p className='login-divider-text'>OR</p>
          <div className='login-divider-line'></div>
        </div>

        <div className='login-social-actions'>
          <button type='button' onClick={loginGoogle} disabled={socialLoading !== ''} className='login-social-btn login-google-btn'><img src={assets.google_icon} alt='' /><span>{socialLoading === 'google' ? 'Connecting...' : 'Login Google'}</span></button>
          <button type='button' onClick={loginFacebook} disabled={socialLoading !== ''} className='login-social-btn login-facebook-btn'><img src={assets.facebook_icon} alt='' /><span>{socialLoading === 'facebook' ? 'Connecting...' : 'Login Facebook'}</span></button>
        </div>

        <p className='login-note'>By continuing, you agree to Distressed account access and checkout security.</p>
      </form>
    </div>
  )
}

export default Login
