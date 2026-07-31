import React, { useEffect, useState } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import ProductItem from './ProductItem';
import useProducts from '../hooks/useProducts'
import './RelatedProducts.css'

const RelatedProducts = ({ productId, category, subCategory }) => {
  const { products } = useProducts();
  const [related, setRelated] = useState([]);
  const [currentGroup, setCurrentGroup] = useState(0)

  useEffect(() => {
    if (products.length > 0) {
      const filtered = products.filter(item => (
        item.category === category
        && item.subCategory === subCategory
        && String(item._id) !== String(productId)
      ));

      setRelated(filtered);
      setCurrentGroup(0)
    }
  }, [products, productId, category, subCategory]);

  const changeGroup = (direction) => {
    const totalGroups = Math.ceil(related.length / 5)

    setCurrentGroup((current) => (current + direction + totalGroups) % totalGroups)
  }

  const visibleProducts = Array.from(
    { length: Math.min(5, related.length) },
    (_, index) => related[(currentGroup * 5 + index) % related.length]
  )

  if (!related.length) return null;

  return (
    <div className='related-products px-4'>
      <div className='text-center text-3xl py-2'>
        <h1 className="title"><span className="title-text">RELATED <span className="title-highlight">PRODUCTS</span></span><span className="title-line"></span></h1>
      </div>

      <div className='related-products-list'>
        {related.length > 5 && <button type='button' onClick={() => changeGroup(-1)} className='related-products-button related-products-button-left' aria-label='Previous related products'><FiChevronLeft /></button>}

        <div key={currentGroup} className='related-products-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 gap-y-6'>
          {visibleProducts.map((item) => (
            <ProductItem
              key={item._id}
              id={item._id}
              name={item.name}
              price={item.price}
              image={item.image}
            />
          ))}
        </div>

        {related.length > 5 && <button type='button' onClick={() => changeGroup(1)} className='related-products-button related-products-button-right' aria-label='Next related products'><FiChevronRight /></button>}
      </div>
    </div>
  )
}

export default RelatedProducts;
