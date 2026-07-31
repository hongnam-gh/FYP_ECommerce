import React, { useEffect, useMemo, useRef } from 'react'
import { FiSearch, FiX } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'
import useProducts from '../hooks/useProducts'
import useSearch from '../hooks/useSearch'
import { currency } from '../constants/shopConfig'
import './SearchBar.css'

const getSearchProductImage = (product) => {
  const image = product.image?.[0]
  if (!image?.includes('/image/upload/')) return image
  return image.replace('/image/upload/', '/image/upload/c_pad,w_160,h_192,b_white,g_south/')
}

const SearchBar = () => {
  const navigate = useNavigate()
  const { search, setSearch, setShowSearch, showSearch } = useSearch()
  const { products } = useProducts()
  const inputRef = useRef(null)

  useEffect(() => {
    if (!showSearch) return

    const focusTimer = setTimeout(() => inputRef.current?.focus(), 280)
    return () => clearTimeout(focusTimer)
  }, [showSearch])

  const cleanText = (text) => String(text || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim()
  const keyword = cleanText(search)

  const results = useMemo(() => {
    if (!keyword) return []

    return products.filter((product) => {
      const productText = cleanText(`
        ${product.name}
        ${product.code}
      `)
      return productText.includes(keyword)
    }).slice(0, 10)
  }, [keyword, products])

  const goToPage = (path) => {
    setShowSearch(false)
    setSearch('')
    navigate(path)
  }

  return (
    <div className={`search-slide-overlay ${showSearch ? 'open' : ''}`} onClick={() => setShowSearch(false)}>
      <aside className='search-slide-panel' onClick={(event) => event.stopPropagation()}>
        <div className='search-slide-header'>
          <div>
            <span>Search</span>
            <p>Find your next piece</p>
          </div>
          <button type='button' onClick={() => setShowSearch(false)} aria-label='Close search'><FiX /></button>
        </div>

        <label className='search-slide-input'>
          <FiSearch />
          <input ref={inputRef} value={search} onChange={(event) => setSearch(event.target.value)} type='text' placeholder='Search products...' />
          {search && <button type='button' onClick={() => setSearch('')} aria-label='Clear search'><FiX /></button>}
        </label>

        <div className='search-slide-results'>
          {!keyword && <div className='search-slide-message search-slide-message-start'><b>What Are You Looking For?</b></div>}
          {keyword && results.length === 0 && <div className='search-slide-message'><b>Nothing found</b><span>Try another keyword or explore Women and Men below.</span></div>}

          {results.map((product) => (
            <button type='button' key={product._id} onClick={() => goToPage(`/product/${product._id}`)} className='search-slide-product'>
              <span className='search-slide-product-image'><img src={getSearchProductImage(product)} alt={product.name} /></span>
              <span className='search-slide-product-info'>
                <small>{product.category} · {product.subCategory}</small>
                <b>{product.name}</b>
                <em>{currency}{product.price}</em>
              </span>
            </button>
          ))}
        </div>

        <div className='search-slide-categories'>
          <button type='button' onClick={() => goToPage('/women/view-all')}>
            <img src={assets.women_search_bar} alt='Women collection' />
            <span>Women</span>
          </button>
          <button type='button' onClick={() => goToPage('/men/view-all')}>
            <img src={assets.men_search_bar} alt='Men collection' />
            <span>Men</span>
          </button>
          <button type='button' onClick={() => goToPage('/discover-fashion?newArrival=true')}>
            <img src={assets.new_arrival_search_bar} alt='New arrivals' />
            <span>New Arrivals</span>
          </button>
          <button type='button' onClick={() => goToPage('/accessories/view-all')}>
            <img src={assets.accessories_search_bar} alt='Accessories collection' />
            <span>Accessories</span>
          </button>
        </div>
      </aside>
    </div>
  )
}

export default SearchBar
