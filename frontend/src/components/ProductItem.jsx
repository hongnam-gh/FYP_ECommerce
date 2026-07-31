import React, { useState } from 'react'
import { currency } from '../constants/shopConfig'
import useProducts from '../hooks/useProducts'

const ProductItem = ({ id, image, name, price }) => {
  const [hovered, setHovered] = useState(false)
  const { products } = useProducts()
  const product = products.find((item) => String(item._id) === String(id))
  const displayImage = hovered && image[1] ? image[1] : image[0]
  const isOutOfStock = product && Object.values(product.stock || {}).reduce((total, quantity) => total + Number(quantity || 0), 0) <= 0

  return (
    <div className='relative text-gray-700 cursor-pointer group' onClick={() => window.location.href = `/product/${id}`} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div className='relative overflow-hidden'>
        <img className={`w-full aspect-[3/4] object-contain transition-all duration-500 ${isOutOfStock ? 'grayscale opacity-50' : ''}`} src={displayImage} alt='' />
        {isOutOfStock && <span className='absolute inset-0 flex items-center justify-center text-xl font-extrabold tracking-wider text-red-600 uppercase'>Out of Stock</span>}
      </div>
      <p className='pt-3 pb-1 text-sm'>{name}</p>
      <p className='text-sm font-medium'>{currency}{price}</p>
    </div>
  )
}

export default ProductItem
