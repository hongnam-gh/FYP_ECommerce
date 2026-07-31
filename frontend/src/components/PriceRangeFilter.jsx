import React, { useEffect, useMemo, useState } from 'react'
import { currency } from '../constants/shopConfig'

const PriceRangeFilter = ({ products, onChange }) => {
  const highestPrice = useMemo(() => {
    const price = Math.max(...products.map((item) => Number(item.price || 0)), 0)
    return Math.max(Math.ceil(price / 10) * 10, 10)
  }, [products])
  const step = highestPrice <= 100 ? 1 : 10
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(highestPrice)

  useEffect(() => {
    setMinPrice(0)
    setMaxPrice(highestPrice)
  }, [highestPrice])

  const changeMinPrice = (event) => {
    const value = Math.min(Number(event.target.value), maxPrice - step)
    setMinPrice(value)
    onChange([value, maxPrice])
  }

  const changeMaxPrice = (event) => {
    const value = Math.max(Number(event.target.value), minPrice + step)
    setMaxPrice(value)
    onChange([minPrice, value])
  }

  const resetPrice = () => {
    setMinPrice(0)
    setMaxPrice(highestPrice)
    onChange(null)
  }

  return (
    <div className='chung-price-range'>
      <div className='chung-price-header'>
        <div><span></span><p>PRICE RANGE</p></div>
        <button type='button' onClick={resetPrice}>Reset</button>
      </div>

      <div className='chung-price-values'>
        <div><small>MIN</small><b>{currency}{minPrice.toLocaleString()}</b></div>
        <span>—</span>
        <div><small>MAX</small><b>{currency}{maxPrice.toLocaleString()}</b></div>
      </div>

      <div className='chung-price-sliders'>
        <div className='chung-price-track'></div>
        <div className='chung-price-progress' style={{ left: `${(minPrice / highestPrice) * 100}%`, right: `${100 - ((maxPrice / highestPrice) * 100)}%` }}></div>
        <input type='range' min='0' max={highestPrice} step={step} value={minPrice} onChange={changeMinPrice} aria-label='Minimum price' />
        <input type='range' min='0' max={highestPrice} step={step} value={maxPrice} onChange={changeMaxPrice} aria-label='Maximum price' />
      </div>
    </div>
  )
}

export default PriceRangeFilter
