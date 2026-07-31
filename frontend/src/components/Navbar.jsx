import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FiSearch, FiUser, FiShoppingCart, FiMenu, FiChevronLeft, FiTrash2, FiBell } from 'react-icons/fi'
import { io } from 'socket.io-client'
import { assets } from '../assets/assets'
import axios from 'axios'
import { toast } from 'react-toastify'
import useAuth from '../hooks/useAuth'
import useCart from '../hooks/useCart'
import useProducts from '../hooks/useProducts'
import useSearch from '../hooks/useSearch'
import { backendUrl, currency } from '../constants/shopConfig'
import AccountSlideBar from './AccountSlideBar'
import MenuSlideBar from './MenuSlideBar'
import './Navbar.css'

const menuData = {
  'New Arrivals': [
    { name: 'New Arrivals For Women', path: '/new-arrivals/women' },
    { name: 'New Arrivals For Men', path: '/new-arrivals/men' },
    { name: 'New Arrivals Accessories', path: '/new-arrivals/accessories' },
    { name: 'Discover Fashion', path: '/discover-fashion' }
  ],
  Women: [
    { name: 'View All', path: '/women/view-all' },
    { name: 'Outerwears & Jackets', path: '/women/outerwears' },
    { name: 'Tops & Shirts', path: '/women/tops-shirts' },
    { name: 'Bottom Wear', path: '/women/bottomwear' }
  ],
  Men: [
    { name: 'View All', path: '/men/view-all' },
    { name: 'Outerwears & Jackets', path: '/men/outerwears' },
    { name: 'Tops & Shirts', path: '/men/tops-shirts' },
    { name: 'Bottom Wear', path: '/men/bottomwear' }
  ],
  Accessories: [
    { name: 'View All', path: '/accessories/view-all' },
    { name: 'Bags', path: '/accessories/bags' },
    { name: 'Boxers', path: '/accessories/boxers' },
    { name: 'Hats', path: '/accessories/hats' },
    { name: 'Charms & Stuff', path: '/accessories/charms-stuff' }
  ],
  Collection: [
    { name: 'View All Collection', path: '/collection/view-all' },
    { name: 'Women Collection', path: '/women-collection' },
    { name: 'Men Collection', path: '/men-collection' }
  ]
}

const rankColors = {
  standard: '#1f506d',
  silver: '#a7a7a7',
  gold: '#d2a13a',
  diamond: '#0e7490'
}

const Navbar = () => {
  const [visible, setVisible] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeMenu, setActiveMenu] = useState('New Arrivals')
  const [stockData, setStockData] = useState({})
  const [cartStockLoaded, setCartStockLoaded] = useState(false)
  const [cartSmoke, setCartSmoke] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [userAvatar, setUserAvatar] = useState('')
  const [userProfile, setUserProfile] = useState(null)
  const [socialProvider, setSocialProvider] = useState('')
  const [accountStats, setAccountStats] = useState(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarDeleting, setAvatarDeleting] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const cartSmokeTimersRef = useRef([])
  const { showSearch, setShowSearch } = useSearch()
  const { token, setToken } = useAuth()
  const { products } = useProducts()
  const { cartItems, setCartItems, getCartCount, updateQuantity, getCartAmount } = useCart()
  const unreadNotificationCount = notifications.filter((notification) => !notification.read).length
  const rankKey = (accountStats?.rank || 'Standard').toLowerCase()

  useEffect(() => {
    const closeOnEsc = (e) => { if (e.key === 'Escape') { setMenuOpen(false); setShowSearch(false); setNotificationOpen(false); setAccountOpen(false) } }
    window.addEventListener('keydown', closeOnEsc)
    return () => window.removeEventListener('keydown', closeOnEsc)
  }, [setShowSearch])

  useEffect(() => {
    const showCartSmoke = () => {
      cartSmokeTimersRef.current.forEach(clearTimeout)
      cartSmokeTimersRef.current = []

      setCartSmoke(false)
      cartSmokeTimersRef.current.push(setTimeout(() => setCartSmoke(true), 20))
      cartSmokeTimersRef.current.push(setTimeout(() => setCartSmoke(false), 900))
    }

    window.addEventListener('cart-smoke', showCartSmoke)
    return () => {
      window.removeEventListener('cart-smoke', showCartSmoke)
      cartSmokeTimersRef.current.forEach(clearTimeout)
    }
  }, [])

  const logout = () => {
    window.location.href = '/login'
    localStorage.removeItem('token')
    setToken('')
    setCartItems({})
    setNotifications([])
    setUserAvatar('')
    setUserProfile(null)
    setSocialProvider('')
    setAccountStats({ totalSpent: 0, totalOrders: 0, rank: 'Standard' })
    setNotificationOpen(false)
    setAccountOpen(false)
  }

  const closeChat = () => window.dispatchEvent(new Event('close-chat'))

  const uploadAvatar = async (event) => {
    const file = event.target.files[0]
    event.target.value = ''
    if (!file || avatarUploading || socialProvider) return

    if (!file.type.startsWith('image/')) {
      toast.error('Avatar must be an image')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Avatar must be smaller than 5MB')
      return
    }

    const formData = new FormData()
    formData.append('avatar', file)
    setAvatarUploading(true)

    try {
      const response = await axios.post(backendUrl + '/api/user/avatar', formData, { headers: { token } })
      if (response.data.success) {
        setUserAvatar(response.data.avatar)
        setUserProfile((prev) => ({ ...prev, avatar: response.data.avatar }))
      }
      else toast.error(response.data.message)
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setAvatarUploading(false)
    }
  }

  const deleteAvatar = async () => {
    if (avatarDeleting || socialProvider || !userAvatar) return

    setAvatarDeleting(true)

    try {
      const response = await axios.post(backendUrl + '/api/user/avatar/delete', {}, { headers: { token } })
      if (response.data.success) {
        setUserAvatar('')
        setUserProfile((prev) => ({ ...prev, avatar: '' }))
      } else toast.error(response.data.message)
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setAvatarDeleting(false)
    }
  }

  const fetchNotifications = async () => {
    if (!token) {
      setNotifications([])
      return
    }

    try {
      const response = await axios.post(backendUrl + '/api/notification/list', {}, { headers: { token } })
      if (response.data.success) setNotifications(response.data.notifications)
    } catch (error) {
      console.log(error)
    }
  }

  const toggleNotifications = () => {
    if (!token) {
      window.location.href = '/login'
      return
    }

    if (notificationOpen) {
      setNotificationOpen(false)
      return
    }

    closeChat()
    setShowSearch(false)
    setMenuOpen(false)
    setAccountOpen(false)

    setNotificationOpen(true)
  }

  const markAllNotificationsRead = async () => {
    if (unreadNotificationCount === 0) return

    const oldNotifications = notifications
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))

    try {
      const response = await axios.post(backendUrl + '/api/notification/read', {}, { headers: { token } })
      if (!response.data.success) setNotifications(oldNotifications)
    } catch (error) {
      console.log(error)
      setNotifications(oldNotifications)
    }
  }

  const openNotification = async (notification) => {
    if (!notification.read) {
      setNotifications((prev) => prev.map((item) => item._id === notification._id ? { ...item, read: true } : item))

      try {
        await axios.post(backendUrl + '/api/notification/read-one', { notificationId: notification._id }, { headers: { token } })
      } catch (error) {
        console.log(error)
      }
    }

    if (notification.orderId) window.location.href = `/track-order/${notification.orderId}`
    else if (notification.productId) window.location.href = `/product/${notification.productId}`
  }

  const deleteNotification = async (event, notificationId) => {
    event.preventDefault()
    event.stopPropagation()
    const oldNotifications = notifications
    setNotifications((prev) => prev.filter((notification) => notification._id !== notificationId))

    try {
      const response = await axios.post(backendUrl + '/api/notification/delete', { notificationId }, { headers: { token } })
      if (!response.data.success) setNotifications(oldNotifications)
    } catch (error) {
      console.log(error)
      setNotifications(oldNotifications)
    }
  }

  const formatNotificationTime = (date) => {
    const value = new Date(date)
    const time = value.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
    const day = String(value.getDate()).padStart(2, '0')
    const month = String(value.getMonth() + 1).padStart(2, '0')

    return `${time} | ${day}/${month}/${value.getFullYear()}`
  }

  const getNotificationProductImage = (notification) => {
    if (!notification.productImage?.includes('/image/upload/')) return notification.productImage
    return notification.productImage.replace('/image/upload/', '/image/upload/c_pad,w_140,h_168,b_white,g_south/')
  }

  useEffect(() => {
    fetchNotifications()
  }, [token])

  const fetchUserProfile = useCallback(async () => {
    if (!token) {
      setUserAvatar('')
      setUserProfile(null)
      setSocialProvider('')
      setAccountStats(null)
      return
    }

    try {
      const response = await axios.post(backendUrl + '/api/user/profile', {}, { headers: { token } })
      if (response.data.success) {
        setUserAvatar(response.data.user.avatar || '')
        setUserProfile(response.data.user)
        setSocialProvider(response.data.socialProvider || '')
        setAccountStats(response.data.accountStats || null)
      }
    } catch (error) {
      console.log(error)
    }
  }, [token])

  useEffect(() => {
    fetchUserProfile()
  }, [fetchUserProfile])

  useEffect(() => {
    const refreshNotifications = () => fetchNotifications()
    window.addEventListener('notifications-updated', refreshNotifications)
    return () => window.removeEventListener('notifications-updated', refreshNotifications)
  }, [token])

  useEffect(() => {
    if (!token) return

    const socket = io(backendUrl, { auth: { token } })
    const addNotification = ({ notification }) => {
      setNotifications((prev) => [notification, ...prev.filter((item) => item._id !== notification._id)])
      window.dispatchEvent(new CustomEvent('order-status-updated', { detail: { notification } }))
    }

    socket.on('notification:new', addNotification)

    return () => {
      socket.off('notification:new', addNotification)
      socket.disconnect()
    }
  }, [token])

  const openSideMenu = (menu) => {
    setShowSearch(false)
    setNotificationOpen(false)
    setAccountOpen(false)
    setActiveMenu(menu)
    setMenuOpen(true)
  }

  const openAccount = () => {
    closeChat()
    setShowSearch(false)
    setNotificationOpen(false)
    setMenuOpen(false)
    if (!accountOpen) fetchUserProfile()
    setAccountOpen((prev) => !prev)
  }

  const goMenuPage = (path) => {
    setMenuOpen(false)
    setVisible(false)
    window.location.href = path
  }

  const cartPreview = useMemo(() => {
    const cartPreview = []
    for (const productId in cartItems) {
      for (const size in cartItems[productId]) {
        if (cartItems[productId][size] > 0) {
          const productData = products.find(product => product._id === productId)
          if (productData) cartPreview.push({ ...productData, size, quantity: cartItems[productId][size] })
        }
      }
    }
    return cartPreview
  }, [cartItems, products])

  const fetchNavbarCartStock = useCallback(async () => {
    try {
      const tempStock = {}

      for (const item of cartPreview) {
        if (!tempStock[item._id]) {
          const response = await axios.post(backendUrl + '/api/inventory/single-public', { productId: item._id })
          tempStock[item._id] = response.data.success ? response.data.inventory?.stock || {} : {}
        }
      }

      setStockData(tempStock)
      setCartStockLoaded(true)
      return tempStock
    } catch (error) {
      console.log(error)
      setStockData({})
      setCartStockLoaded(false)
      return null
    }
  }, [cartPreview])

  useEffect(() => {
    if (cartPreview.length > 0) fetchNavbarCartStock()
    else {
      setStockData({})
      setCartStockLoaded(false)
    }
  }, [cartPreview.length, fetchNavbarCartStock])

  useEffect(() => {
    const refreshNavbarCartStock = () => {
      if (cartPreview.length > 0) fetchNavbarCartStock()
    }

    window.addEventListener('focus', refreshNavbarCartStock)
    window.addEventListener('pageshow', refreshNavbarCartStock)

    return () => {
      window.removeEventListener('focus', refreshNavbarCartStock)
      window.removeEventListener('pageshow', refreshNavbarCartStock)
    }
  }, [cartPreview.length, fetchNavbarCartStock])

  const getSizeStock = (itemId, size) => {
    return Number(stockData?.[itemId]?.[size] || 0)
  }

  const hasCartStockIssue = (stock) => cartPreview.some((item) => item.quantity > Number(stock?.[item._id]?.[item.size] || 0))
  const hasUnavailableCartItems = cartStockLoaded && hasCartStockIssue(stockData)

  const payCart = async () => {
    if (!token) {
      window.location.href = '/login?redirect=/place-order'
      return
    }

    const latestStock = await fetchNavbarCartStock()

    if (!latestStock) {
      toast.error('Unable to verify product stock. Please try again.')
      return
    }

    if (hasCartStockIssue(latestStock)) {
      toast.error('Remove or adjust unavailable products before payment.')
      return
    }

    window.location.href = '/place-order'
  }

  const subtotal = getCartAmount()
  const discountAmount = Number((subtotal * Number(accountStats?.discountPercent || 0) / 100).toFixed(2))
  const total = accountStats ? Number((subtotal - discountAmount + Number(accountStats.deliveryFee)).toFixed(2)) : subtotal

  return (
    <div className='navbar'>
      <div className='navbar-main'>
        {/* Desktop menu links */}
        <ul className='navbar-desktop-menu'>
          {Object.keys(menuData).map(item => <li key={item} onMouseEnter={() => openSideMenu(item)} className={`chat-auto-close navbar-menu-item ${activeMenu === item && menuOpen ? 'active' : ''}`}>{item}</li>)}
        </ul>

        {/* Logo */}
        <img onClick={() => window.location.href = '/'} src={assets.logo} className='navbar-logo' alt='' />

        {/* Right icons */}
        <div className='navbar-actions'>
          {/* Desktop search */}
          <div className={`navbar-search ${showSearch ? 'open' : ''}`}>
            <button type='button' onClick={() => { closeChat(); setMenuOpen(false); setNotificationOpen(false); setAccountOpen(false); setShowSearch(!showSearch) }} className={`navbar-icon-btn ${showSearch ? 'search-open-btn' : ''}`}><FiSearch /></button>
          </div>

          {/* Mobile search */}
          <button type='button' onClick={() => { closeChat(); setNotificationOpen(false); setAccountOpen(false); setShowSearch(!showSearch) }} className={`navbar-icon-btn mobile-search-btn ${showSearch ? 'search-open-btn' : ''}`}><FiSearch /></button>

          {/* Notification */}
          <div className='chat-auto-close navbar-notification'>
            <button type='button' onClick={toggleNotifications} className={`navbar-icon-btn navbar-notification-btn ${notificationOpen ? 'active' : ''}`}>
              <FiBell />
              {unreadNotificationCount > 0 && <span className='navbar-notification-count'>{unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}</span>}
            </button>

            {notificationOpen && (
              <div onClick={() => setNotificationOpen(false)} className='navbar-notification-backdrop'></div>
            )}

            {notificationOpen && (
              <div className='navbar-notification-panel'>
                <div className='navbar-notification-header'>
                  <div>
                    <p>Notifications</p>
                    <span>Order activity and delivery updates</span>
                  </div>
                  <div className='navbar-notification-header-actions'>
                    <button type='button' onClick={markAllNotificationsRead} disabled={unreadNotificationCount === 0} className='navbar-notification-read-all'>Mark all as read</button>
                    <button type='button' onClick={() => setNotificationOpen(false)} className='navbar-notification-close'>×</button>
                  </div>
                </div>

                <div className='navbar-notification-list'>
                  {notifications.length === 0 ? (
                    <div className='navbar-notification-empty'>
                      <p>No notifications yet</p>
                      <span>Your order updates will appear here.</span>
                    </div>
                  ) : notifications.map((notification) => (
                    <div key={notification._id} role='button' tabIndex={0} onClick={() => openNotification(notification)} onKeyDown={(event) => { if (event.key === 'Enter') openNotification(notification) }} className={`navbar-notification-card navbar-notification-${notification.type} ${notification.productImage ? 'has-product-image' : ''} ${!notification.read ? 'unread' : ''}`}>
                      {notification.productImage && <span className='navbar-notification-product-image'><img src={getNotificationProductImage(notification)} alt={notification.title} /></span>}
                      <span className='navbar-notification-content'>
                        <span className='navbar-notification-meta'>
                          <span>{!notification.read && <i className='navbar-notification-unread-dot' />}<em>{notification.type || 'Update'}</em><time>{formatNotificationTime(notification.date)}</time></span>
                          <button
                            type='button'
                            onPointerDown={(event) => event.stopPropagation()}
                            onKeyDown={(event) => event.stopPropagation()}
                            onClick={(event) => deleteNotification(event, notification._id)}
                            className='navbar-notification-delete'
                            aria-label='Remove notification'
                            title='Remove notification'
                          >
                            ×
                          </button>
                        </span>
                        <b>{notification.title}</b>
                        <small>{notification.message}</small>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User account */}
          <div className='navbar-user'>
            {token ? (
              <button type='button' onClick={openAccount} style={{ '--navbar-rank-color': rankColors[rankKey] || rankColors.standard }} className={`navbar-avatar-btn ${accountOpen ? 'active' : ''}`} title={`${accountStats?.rank || 'Standard'} Membership`}>
                <img src={userAvatar || assets.default_avatar} alt='User avatar' />
              </button>
            ) : (
              <button type='button' onClick={() => window.location.href = '/login'} className='navbar-icon-btn'><FiUser /></button>
            )}
          </div>

          {/* Cart preview */}
          <div onMouseEnter={() => { setShowSearch(false); setNotificationOpen(false); setAccountOpen(false) }} className='chat-auto-close navbar-cart'>
            <div onClick={() => window.location.href = '/cart'} className={`navbar-icon-btn navbar-cart-icon ${cartSmoke ? 'navbar-cart-smoke-active' : ''}`}>
              <FiShoppingCart />
              {cartSmoke && (
                <div className='navbar-cart-smoke'>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              )}
              <p>{getCartCount(cartItems)}</p>
            </div>

            <div className='navbar-cart-dropdown'>
              <div className='navbar-cart-gap'></div>
              <div className='navbar-cart-card'>
                {cartPreview.length === 0 ? (
                  <div className='navbar-empty-cart'>
                    <div>🛒</div>
                    <p>Your Shopping Cart Is Empty</p>
                    <span>Add something first bro.</span>
                  </div>
                ) : (
                  <>
                    <div className='navbar-cart-list'>
                      {cartPreview.map((item, index) => {
                        const maxStock = getSizeStock(item._id, item.size)
                        const isMaxStock = item.quantity >= maxStock

                        return (
                          <div key={`${item._id}-${item.size}-${index}`} className='navbar-cart-item'>
                            <img src={item.image[0]} alt='' />

                            <div className='navbar-cart-info'>
                              <div className='navbar-cart-top'>
                                <div>
                                  <p className='navbar-cart-name'>{item.name}</p>
                                  <span>Size: {item.size}</span>
                                  <h4>{currency}{item.price}</h4>
                                </div>

                                <button type='button' onClick={() => updateQuantity(item._id, item.size, 0)} className='navbar-cart-remove'><FiTrash2 /></button>
                              </div>

                              <div className='navbar-qty'>
                                <button type='button' onClick={() => updateQuantity(item._id, item.size, Math.max(item.quantity - 1, 1), maxStock)}>−</button>
                                <span>{item.quantity}</span>
                                <button type='button' disabled={isMaxStock} onClick={() => updateQuantity(item._id, item.size, item.quantity + 1, maxStock)} className={isMaxStock ? 'navbar-qty-disabled' : ''}>+</button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className='navbar-cart-footer'>
                      <div className='navbar-cart-total'>
                        <p>Total:</p>
                        <p>{currency}{total}</p>
                      </div>

                      <div className='navbar-cart-buttons'>
                        <button type='button' onClick={() => window.location.href = '/cart'}>View Cart</button>
                        <button type='button' disabled={hasUnavailableCartItems} onClick={payCart} className={hasUnavailableCartItems ? 'navbar-cart-pay-disabled' : ''}>Pay</button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <button type='button' onMouseEnter={() => setAccountOpen(false)} onClick={() => { setAccountOpen(false); setVisible(true) }} className='chat-auto-close navbar-icon-btn navbar-mobile-menu-btn'><FiMenu /></button>
        </div>
      </div>

      <AccountSlideBar
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        onLogout={logout}
        user={userProfile}
        socialProvider={socialProvider}
        accountStats={accountStats}
        avatarUploading={avatarUploading}
        avatarDeleting={avatarDeleting}
        onUploadAvatar={uploadAvatar}
        onDeleteAvatar={deleteAvatar}
      />

      <MenuSlideBar
        open={menuOpen}
        activeMenu={activeMenu}
        menuData={menuData}
        onClose={() => setMenuOpen(false)}
        onOpen={() => setMenuOpen(true)}
        onNavigate={goMenuPage}
        onLogout={logout}
      />

      {/* Mobile full screen menu */}
      <div className={`chat-auto-close navbar-mobile-panel ${visible ? 'open' : ''}`}>
        <div className='navbar-mobile-inner'>
          <div onClick={() => setVisible(false)} className='navbar-mobile-back'><FiChevronLeft /><p>Back</p></div>

          {Object.keys(menuData).map(menu => (
            <div key={menu} className='navbar-mobile-group'>
              <div onClick={() => setActiveMenu(activeMenu === menu ? '' : menu)} className='navbar-mobile-title'>
                <p>{menu}</p>
                <p>{activeMenu === menu ? '−' : '+'}</p>
              </div>

              {activeMenu === menu && (
                <div className='navbar-mobile-links'>
                  {menuData[menu].map(item => <p key={item.name} onClick={() => goMenuPage(item.path)}>{item.name}</p>)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Navbar
