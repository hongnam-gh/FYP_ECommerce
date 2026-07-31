import React, { useRef, useState } from 'react'
import { FiArrowRight, FiCheck, FiEye, FiEyeOff, FiHeart, FiLogOut, FiMessageCircle, FiPackage, FiShoppingCart } from 'react-icons/fi'
import { assets } from '../assets/assets'
import { currency } from '../constants/shopConfig'
import './AccountSlideBar.css'

const rankBackgrounds = {
  standard: assets.standard_rank,
  silver: assets.silver_rank,
  gold: assets.gold_rank,
  diamond: assets.diamond_rank
}

const AccountSlideBar = ({ open, onClose, onLogout, user, socialProvider, accountStats, avatarUploading, avatarDeleting, onUploadAvatar, onDeleteAvatar }) => {
  const [showSpent, setShowSpent] = useState(false)
  const avatarInputRef = useRef(null)
  const providerName = socialProvider === 'google' ? 'Google' : socialProvider === 'facebook' ? 'Facebook' : ''
  const rankName = accountStats?.rank || 'Standard'
  const rankKey = rankName.toLowerCase()
  const totalSpent = `${currency}${Number(accountStats?.totalSpent || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`

  const goPage = (path) => {
    onClose()
    window.location.href = path
  }

  const openSupport = () => {
    onClose()
    window.dispatchEvent(new Event('open-chat'))
  }

  return (
    <div className={`account-slide-overlay ${open ? 'open' : ''}`}>
      <div onClick={onClose} className='account-slide-backdrop'></div>

      <div className={`account-slide-panel ${open ? 'open' : ''}`}>
        <button type='button' onClick={onClose} className='account-slide-close'>×</button>

        <div className='account-slide-content'>
          <div className={`account-slide-profile rank-${rankKey}`} style={{ backgroundImage: `url(${rankBackgrounds[rankKey] || assets.standard_rank})` }}>
            <div role={!providerName ? 'button' : undefined} tabIndex={!providerName ? 0 : undefined} onClick={() => !providerName && !avatarUploading && !avatarDeleting && avatarInputRef.current?.click()} onKeyDown={(event) => { if (!providerName && event.key === 'Enter') avatarInputRef.current?.click() }} className={`account-slide-avatar ${!providerName ? 'editable' : ''} ${avatarUploading || avatarDeleting ? 'loading' : ''}`}>
              <img src={user?.avatar || assets.default_avatar} alt='User avatar' />
              {providerName && <span className={`account-slide-avatar-tick ${socialProvider}`}><FiCheck /></span>}
              {!providerName && user?.avatar && <button type='button' onClick={(event) => { event.stopPropagation(); onDeleteAvatar() }} disabled={avatarDeleting} className='account-slide-avatar-delete' title='Delete avatar'>×</button>}
            </div>
            {!providerName && <input ref={avatarInputRef} onChange={onUploadAvatar} className='account-slide-avatar-input' type='file' accept='image/*' />}

            {providerName && (
              <div className={`account-slide-connected ${socialProvider}`}>
                <span>Connected with {providerName}</span>
                <i><FiCheck /></i>
              </div>
            )}

            <h2>{user?.name || 'User'}</h2>
            <p>{user?.email || 'Email not provided'}</p>
            <span className={`account-slide-rank ${rankKey}`}>{rankName} Membership</span>
          </div>

          <div className='account-slide-stats'>
            <div className='account-slide-stat'>
              <div>
                <small>Total Spent</small>
                <button type='button' onClick={() => setShowSpent((prev) => !prev)} title={showSpent ? 'Hide total spent' : 'Show total spent'}>{showSpent ? <FiEyeOff /> : <FiEye />}</button>
              </div>
              <p>{showSpent ? totalSpent : `${currency}••••••`}</p>
            </div>

            <div className='account-slide-stat'>
              <div><small>Total Orders</small></div>
              <p>{accountStats?.totalOrders || 0}</p>
            </div>
          </div>

          <div className='account-slide-actions'>
            <button type='button' onClick={() => goPage('/orders')}>
              <span><FiPackage /></span>
              <div><p>My Orders</p><small>View and track orders</small></div>
              <FiArrowRight />
            </button>
            <button type='button' onClick={() => goPage('/wishlist')}>
              <span><FiHeart /></span>
              <div><p>Wishlist</p><small>Your saved products</small></div>
              <FiArrowRight />
            </button>
            <button type='button' onClick={() => goPage('/cart')}>
              <span><FiShoppingCart /></span>
              <div><p>Shopping Cart</p><small>Review your cart</small></div>
              <FiArrowRight />
            </button>
            <button type='button' onClick={openSupport}>
              <span><FiMessageCircle /></span>
              <div><p>Support</p><small>Chat with our team</small></div>
              <FiArrowRight />
            </button>
          </div>

          <button type='button' onClick={onLogout} className='account-slide-logout'>
            <span><FiLogOut /> Logout</span>
            <FiArrowRight />
          </button>
        </div>
      </div>
    </div>
  )
}

export default AccountSlideBar
