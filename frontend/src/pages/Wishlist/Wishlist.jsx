import React from 'react'
import { FiHeart, FiTrash2 } from 'react-icons/fi'
import { assets } from '../../assets/assets'
import useAuth from '../../hooks/useAuth'
import useProducts from '../../hooks/useProducts'
import useWishlist from '../../hooks/useWishlist'
import { currency } from '../../constants/shopConfig'
import './Wishlist.css'

const Wishlist = () => {
  const { token } = useAuth()
  const { products } = useProducts()
  const { wishlistItems, toggleWishlist } = useWishlist()

  const wishlistProducts = wishlistItems.map((itemId) => products.find((product) => product._id === itemId)).filter(Boolean)

  return (
    <div className='wishlist-page'>
      {!token ? (
        <div className='wishlist-empty-bg' style={{ backgroundImage: `linear-gradient(rgba(0,0,0,.28), rgba(0,0,0,.28)), url(${assets.dashboard_img})` }}>
          <div className='wishlist-empty-wrap'>
            <div className='wishlist-empty-card'>
              <div className='wishlist-empty-icon'><FiHeart /></div>
              <h2 className='wishlist-empty-title'>Wishlist Needs Login</h2>
              <p className='wishlist-empty-text'>Login first so your favorite pieces stay saved in your account.</p>
              <button type='button' onClick={() => window.location.href = '/login?redirect=/wishlist'} className='wishlist-empty-btn'>LOGIN NOW</button>
            </div>
          </div>
        </div>
      ) : wishlistProducts.length === 0 ? (
        <div className='wishlist-empty-bg' style={{ backgroundImage: `linear-gradient(rgba(0,0,0,.28), rgba(0,0,0,.28)), url(${assets.dashboard_img})` }}>
          <div className='wishlist-empty-wrap'>
            <div className='wishlist-empty-card'>
              <div className='wishlist-empty-icon'><FiHeart /></div>
              <h2 className='wishlist-empty-title'>Your Wishlist Is Empty</h2>
              <p className='wishlist-empty-text'>Save pieces you love by tapping the heart on any product.</p>
              <button type='button' onClick={() => window.location.href = '/'} className='wishlist-empty-btn'>BACK TO SHOPPING</button>
            </div>
          </div>
        </div>
      ) : (
        <div className='wishlist-container'>
          <div className='wishlist-head'>
            <div>
              <p className='wishlist-eyebrow'>Saved Products</p>
              <h1>Wishlist</h1>
            </div>

            <span>{wishlistProducts.length} item{wishlistProducts.length > 1 ? 's' : ''}</span>
          </div>

          <div className='wishlist-grid'>
            {wishlistProducts.map((item) => (
              <div key={item._id} className='wishlist-card'>
                <button type='button' onClick={() => toggleWishlist(item._id)} className='wishlist-remove-btn'><FiTrash2 /></button>

                <div onClick={() => window.location.href = `/product/${item._id}`} className='wishlist-img-wrap'>
                  <img src={item.image[0]} alt='' />
                </div>

                <div className='wishlist-info'>
                  <p className='wishlist-name'>{item.name}</p>
                  <span>{item.category} / {item.subCategory}</span>
                  <h3>{currency}{item.price}</h3>
                </div>

                <button type='button' onClick={() => window.location.href = `/product/${item._id}`} className='wishlist-view-btn'>VIEW PRODUCT</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Wishlist
