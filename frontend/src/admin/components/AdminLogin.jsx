import axios from 'axios'
import React, { useState } from 'react'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'
import { assets } from '../../assets/assets'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import Navbar from '../../components/Navbar'
import SearchBar from '../../components/SearchBar'
import Footer from '../../components/Footer'
import Chat from '../../pages/Chat'
import './AdminLogin.css'

const AdminLogin = ({ setToken }) => {

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const validateName = (value) => {
    return /^[\p{L}\s]+$/u.test(value.trim())
  }

  const onSubmitHandler = async (e) => {
    try {
      e.preventDefault()

      if (!validateName(name)) {
        toast.error('Admin name cannot include numbers or special characters')
        return
      }

      const response = await axios.post(backendUrl + '/api/user/admin', { name, password, secretKey })

      if (response.data.success) {
        setToken(response.data.token)
        localStorage.setItem('adminToken', response.data.token)
        localStorage.setItem('adminName', response.data.name || name.trim())
        window.location.href = '/admin'
      } else {
        toast.error(response.data.message)
      }

    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  return (
    <>
      <Navbar />
      <div className='navbar-spacer'></div>
      <SearchBar />

      <div className='admin-login-page' style={{ backgroundImage: `linear-gradient(rgba(0,0,0,.25), rgba(0,0,0,.25)), url(${assets.dashboard_img})` }}>
        <form onSubmit={onSubmitHandler} className='admin-login-form'>
          <div className='admin-login-header'>
            <p className='prata-regular admin-login-title'>Admin Login</p>
            <div className='admin-login-line'></div>
            <p className='admin-login-subtitle'>Welcome back to Distressed admin</p>
          </div>

          <div className='admin-login-fields'>
            <input onChange={(e) => setName(e.target.value)} value={name} className='admin-login-input' type='text' placeholder='Name' required />

            <div className='admin-login-input-box'>
              <input onChange={(e) => setPassword(e.target.value)} value={password} className='admin-login-input admin-login-password-input' type={showPassword ? 'text' : 'password'} placeholder='Password' required />
              <button type='button' onClick={() => setShowPassword(!showPassword)} className='admin-login-eye-btn'>{showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}</button>
            </div>

            <input onChange={(e) => setSecretKey(e.target.value)} value={secretKey} className='admin-login-input' type='password' placeholder='Secret Key' required />
          </div>

          <div className='admin-login-links'>
            <p onClick={() => window.location.href = '/login'} className='admin-login-link'>User Login</p>
            <p onClick={() => window.location.href = '/admin/signup'} className='admin-login-link admin-login-link-create'>Create Admin</p>
          </div>

          <button type='submit' className='admin-login-btn'>Log In</button>

          <div className='admin-login-divider'>
            <div className='admin-login-divider-line'></div>
            <p className='admin-login-divider-text'>ADMIN ACCESS</p>
            <div className='admin-login-divider-line'></div>
          </div>

          <p className='admin-login-note'>By continuing, you agree to Distressed admin access and management security.</p>
        </form>
      </div>

      <Footer />
      <Chat />
    </>
  )
}

export default AdminLogin
