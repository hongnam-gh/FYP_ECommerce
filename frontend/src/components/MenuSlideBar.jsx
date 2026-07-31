import React from 'react'
import './MenuSlideBar.css'

const MenuSlideBar = ({ open, activeMenu, menuData, onClose, onOpen, onNavigate, onLogout }) => {
  return (
    <div className={`chat-auto-close menu-slide-overlay ${open ? 'open' : ''}`}>
      <div onClick={onClose} className='menu-slide-backdrop'></div>
      <div onMouseEnter={onOpen} className={`menu-slide-panel ${open ? 'open' : ''}`}>
        <div className='menu-slide-header'>
          <div>
            <p>Menu</p>
            <h3>{activeMenu}</h3>
          </div>
          <button type='button' onClick={onClose}>×</button>
        </div>

        <div className='menu-slide-line'></div>

        <div className='menu-slide-links'>
          {(menuData[activeMenu] || []).map(item => <button key={item.name} type='button' onClick={() => onNavigate(item.path)}><span>{item.name}</span><span>→</span></button>)}
        </div>

        <div className='menu-slide-line bottom'></div>

        <div className='menu-slide-cards'>
          <button type='button' onClick={() => onNavigate('/purchase-guidance')}><span>Purchase Guidance</span><span>→</span></button>
          <button type='button' onClick={() => onNavigate('/discover-fashion')}><span>Discover Fashion</span><span>→</span></button>
          <button type='button' onClick={() => onNavigate('/customer-service')}><span>Customer Service</span><span>→</span></button>
          <button type='button' onClick={() => onNavigate('/faq')}><span>FAQ</span><span>→</span></button>
          <button type='button' onClick={() => onNavigate('/admin')}><span>Admin Duty</span><span>→</span></button>
          <button type='button' onClick={onLogout}><span>Logout</span><span>→</span></button>
        </div>
      </div>
    </div>
  )
}

export default MenuSlideBar
