import React from 'react'
import { assets } from '../assets/assets'
import { FiRefreshCw } from 'react-icons/fi'
import './Navbar.css'

const Navbar = () => {
  return (
    <div className='admin-navbar'>

      {/* Logo */}
      <div className='admin-navbar-left'>
        <img className='admin-navbar-logo' src={assets.logo} alt='' />
      </div>

      
      <div className='admin-navbar-center'>
        <h2>Distressed Admin</h2>
        <span>Management Dashboard</span>
      </div>

      {/* Refresh */}
      <button type='button' onClick={() => window.location.reload()} className='admin-navbar-btn' title='Refresh page'>
        <FiRefreshCw />
        <span>Refresh</span>
      </button>

    </div>
  )
}

export default Navbar
