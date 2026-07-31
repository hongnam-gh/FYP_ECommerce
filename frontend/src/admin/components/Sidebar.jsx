import React from 'react'
import { NavLink } from 'react-router-dom'
import { FiBarChart2, FiCheckSquare, FiPlusSquare, FiList, FiPackage, FiMessageCircle, FiLogOut, FiImage, FiLayers, FiUsers } from 'react-icons/fi'
import { MdInventory2 } from 'react-icons/md'
import './Sidebar.css'

const Sidebar = ({ alerts, adminName, logoutAdmin }) => {
  return (
    <div className='admin-sidebar'>
      
      <div className='admin-sidebar-brand'>
        <span>ADM</span>
        <p className='admin-sidebar-welcome'>Welcome Admin: {adminName || 'Admin'}</p>
      </div>

      
      <div className='admin-sidebar-menu'>

        {/* Statistics */}
        <NavLink className='admin-sidebar-link' to='/admin/statistics'>
          <span className='admin-sidebar-icon'><FiBarChart2 /></span>
          <p className='admin-sidebar-text'>Statistic Management</p>
        </NavLink>

        {/* Orders */}
        <NavLink className='admin-sidebar-link' to='/admin/orders'>
          <span className='admin-sidebar-icon'><FiPackage /></span>
          <p className='admin-sidebar-text'>Order Details</p>
          {alerts?.orders && <span className='admin-sidebar-dot'></span>}
        </NavLink>

        {/* Approve Orders */}
        <NavLink className='admin-sidebar-link' to='/admin/approve-order'>
          <span className='admin-sidebar-icon'><FiCheckSquare /></span>
          <p className='admin-sidebar-text'>Approve Order</p>
          {alerts?.approvals && <span className='admin-sidebar-dot'></span>}
        </NavLink>

        {/* Customer Messages */}
        <NavLink className='admin-sidebar-link' to='/admin/customer-message'>
          <span className='admin-sidebar-icon'><FiMessageCircle /></span>
          <p className='admin-sidebar-text'>Customer Messages</p>
          {alerts?.messages && <span className='admin-sidebar-dot'></span>}
        </NavLink>

        {/* User Management */}
        <NavLink className='admin-sidebar-link' to='/admin/user-management'>
          <span className='admin-sidebar-icon'><FiUsers /></span>
          <p className='admin-sidebar-text'>User Management</p>
        </NavLink>

        {/* Inventory */}
        <NavLink className='admin-sidebar-link' to='/admin/inventory'>
          <span className='admin-sidebar-icon'><MdInventory2 /></span>
          <p className='admin-sidebar-text'>Inventory Management</p>
        </NavLink>

        {/* Add Product */}
        <NavLink className='admin-sidebar-link' to='/admin/add'>
          <span className='admin-sidebar-icon'><FiPlusSquare /></span>
          <p className='admin-sidebar-text'>Add Products</p>
        </NavLink>

        {/* Product List */}
        <NavLink className='admin-sidebar-link' to='/admin/list'>
          <span className='admin-sidebar-icon'><FiList /></span>
          <p className='admin-sidebar-text'>List Products</p>
        </NavLink>

                {/* Banner Management */}
        <NavLink className='admin-sidebar-link' to='/admin/banner-management'>
          <span className='admin-sidebar-icon'><FiImage /></span>
          <p className='admin-sidebar-text'>Banner Management</p>
        </NavLink>

        {/* Collection Management */}
        <NavLink className='admin-sidebar-link' to='/admin/collection-management'>
          <span className='admin-sidebar-icon'><FiLayers /></span>
          <p className='admin-sidebar-text'>Collection Management</p>
        </NavLink>


      </div>

      <div className='admin-sidebar-bottom'>
        <button type='button' onClick={logoutAdmin} className='admin-sidebar-logout'>
          <span className='admin-sidebar-icon'><FiLogOut /></span>
          <p className='admin-sidebar-text'>Log Out</p>
        </button>
      </div>
    </div>
  )
}

export default Sidebar
