import React, { useEffect, useState } from 'react'
import useProducts from '../../hooks/useProducts'
import useSearch from '../../hooks/useSearch'
import ProductItem from '../../components/ProductItem'
import ProductFilterSidebar from '../../components/ProductFilterSidebar'
import { emptyAdvancedFilters } from '../../constants/productFilterConfig'
import PageBanner from '../../components/PageBanner'
import '../Chung.css'

const WomenOuterwears = () => {
  const { products } = useProducts()
  const { search, showSearch } = useSearch()
  const [showFilter, setShowFilter] = useState(false)
  const [filterProducts, setFilterProducts] = useState([])
  const [newArrivalOnly, setNewArrivalOnly] = useState(false)
  const [sortType, setSortType] = useState('relavent')
  const [priceRange, setPriceRange] = useState(null)
  const [advancedFilters, setAdvancedFilters] = useState(emptyAdvancedFilters)

  // Filter products theo search + new arrivals
  const applyFilter = () => {
    let productsCopy = products.slice()

    productsCopy = productsCopy.filter(item => item.category === 'Women' && ['Winterwear', 'Outerwears', 'Outerwear & Jacket'].includes(item.subCategory))

    if (showSearch && search) productsCopy = productsCopy.filter(item => item.name.toLowerCase().includes(search.toLowerCase()))
    if (newArrivalOnly) productsCopy = productsCopy.filter(item => item.newarrival)
    if (priceRange) productsCopy = productsCopy.filter(item => item.price >= priceRange[0] && item.price <= priceRange[1])
    if (sortType === 'low-high') productsCopy.sort((a, b) => a.price - b.price)
    if (sortType === 'high-low') productsCopy.sort((a, b) => b.price - a.price)

    setFilterProducts(productsCopy)
  }

  const sortProduct = () => {
    let fpCopy = filterProducts.slice()

    switch (sortType) {
      case 'low-high':
        setFilterProducts(fpCopy.sort((a, b) => (a.price - b.price)))
        break

      case 'high-low':
        setFilterProducts(fpCopy.sort((a, b) => (b.price - a.price)))
        break

      default:
        applyFilter()
        break
    }
  }

  useEffect(() => {
    applyFilter()
  }, [newArrivalOnly, priceRange, advancedFilters, search, showSearch, products])

  useEffect(() => {
    sortProduct()
  }, [sortType])

  return (
    <>
      <PageBanner page='women-outerwears' title='WOMEN OUTERWEARS & JACKETS' />
      <div className='chung-page'>
      <ProductFilterSidebar showFilter={showFilter} setShowFilter={setShowFilter} products={products} filterCategory='Women' advancedFilters={advancedFilters} setAdvancedFilters={setAdvancedFilters} newArrivalOnly={newArrivalOnly} setNewArrivalOnly={setNewArrivalOnly} setPriceRange={setPriceRange} sortType={sortType} setSortType={setSortType} />

      
      <div className='chung-content'>
        <div className='chung-topbar'>
          <h1 className="title"><span className="title-text">ALL <span className="title-highlight">PRODUCTS</span></span><span className="title-line"></span></h1>
        </div>

        {/* Product grid */}
        <div className='chung-product-grid'>
          {filterProducts.map((item, index) => (
            <ProductItem key={index} name={item.name} id={item._id} price={item.price} image={item.image} />
          ))}
        </div>
      </div>
      </div>
    </>
  )
}

export default WomenOuterwears
