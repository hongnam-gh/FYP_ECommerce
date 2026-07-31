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
import './AdminSignup.css'

const AdminSignup = ({ setToken }) => {

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

      const response = await axios.post(backendUrl + '/api/user/admin-signup', { name, password, secretKey })

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

      <div className='admin-signup-page' style={{ backgroundImage: `linear-gradient(rgba(0,0,0,.25), rgba(0,0,0,.25)), url(${assets.dashboard_img})` }}>
        <form onSubmit={onSubmitHandler} className='admin-signup-form'>
          <div className='admin-signup-header'>
            <p className='prata-regular admin-signup-title'>Admin Sign Up</p>
            <div className='admin-signup-line'></div>
            <p className='admin-signup-subtitle'>Create your Distressed admin access</p>
          </div>

          <div className='admin-signup-fields'>
            <input onChange={(e) => setName(e.target.value)} value={name} className='admin-signup-input' type='text' placeholder='Name' required />

            <div className='admin-signup-input-box'>
              <input onChange={(e) => setPassword(e.target.value)} value={password} className='admin-signup-input admin-signup-password-input' type={showPassword ? 'text' : 'password'} placeholder='Password' required />
              <button type='button' onClick={() => setShowPassword(!showPassword)} className='admin-signup-eye-btn'>{showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}</button>
            </div>

            <input onChange={(e) => setSecretKey(e.target.value)} value={secretKey} className='admin-signup-input' type='password' placeholder='Secret Key' required />
          </div>

          <div className='admin-signup-links'>
            <p onClick={() => window.location.href = '/signup'} className='admin-signup-link'>User Sign Up</p>
            <p onClick={() => window.location.href = '/admin'} className='admin-signup-link admin-signup-link-login'>Admin Login</p>
          </div>

          <button type='submit' className='admin-signup-btn'>Sign Up</button>

          <div className='admin-signup-divider'>
            <div className='admin-signup-divider-line'></div>
            <p className='admin-signup-divider-text'>ADMIN ACCESS</p>
            <div className='admin-signup-divider-line'></div>
          </div>

          <p className='admin-signup-note'>By continuing, you agree to Distressed admin access and management security.</p>
        </form>
      </div>

      <Footer />
      <Chat />
    </>
  )
}

export default AdminSignup
