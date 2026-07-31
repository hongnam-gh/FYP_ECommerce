import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Navigate, useParams } from 'react-router-dom'
import useProducts from '../../hooks/useProducts'
import useSearch from '../../hooks/useSearch'
import { assets } from '../../assets/assets'
import ProductItem from '../../components/ProductItem'
import ProductFilterSidebar from '../../components/ProductFilterSidebar'
import { emptyAdvancedFilters } from '../../constants/productFilterConfig'
import { backendUrl } from '../../constants/shopConfig'
import '../Chung.css'
import './WomenCollectionView.css'

const hasProduct = (collection, productId) => {
  return collection?.products?.some((item) => String(item?._id || item) === String(productId))
}

const WomenCollectionView = () => {
  const { collectionRoute } = useParams()
  const { products } = useProducts()
  const { search, showSearch } = useSearch()
  const [collection, setCollection] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [showFilter, setShowFilter] = useState(false)
  const [newArrivalOnly, setNewArrivalOnly] = useState(false)
  const [sortType, setSortType] = useState('relavent')
  const [priceRange, setPriceRange] = useState(null)
  const [advancedFilters, setAdvancedFilters] = useState(emptyAdvancedFilters)

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        const response = await axios.get(backendUrl + '/api/collection/list')
        if (response.data.success) {
          const selectedCollection = response.data.collections.find((item) => item.path === `/collection/${collectionRoute}` && item.gender === 'Women')
          setCollection(selectedCollection || null)
        }
      } catch (error) {
        console.log(error)
      } finally {
        setLoaded(true)
      }
    }

    fetchCollection()
  }, [collectionRoute])

  useEffect(() => {
    setNewArrivalOnly(false)
    setSortType('relavent')
    setPriceRange(null)
    setAdvancedFilters(emptyAdvancedFilters)
  }, [collectionRoute])

  const collectionProducts = useMemo(() => {
    return products.filter((product) => hasProduct(collection, product._id))
  }, [products, collection])

  const filterProducts = useMemo(() => {
    let filtered = collectionProducts.slice()

    if (showSearch && search) filtered = filtered.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()))
    if (newArrivalOnly) filtered = filtered.filter((item) => item.newarrival)
    if (priceRange) filtered = filtered.filter((item) => item.price >= priceRange[0] && item.price <= priceRange[1])
    if (sortType === 'low-high') filtered.sort((a, b) => a.price - b.price)
    if (sortType === 'high-low') filtered.sort((a, b) => b.price - a.price)

    return filtered
  }, [collectionProducts, newArrivalOnly, priceRange, advancedFilters, search, showSearch, sortType])

  if (!loaded) return <div className='collection-route-state'>Loading Collection...</div>
  if (!collection) return <Navigate to='/women-collection' replace />

  return (
    <>
      <div className='chung-banner'>
        <img src={collection.image || assets.dashboard_img} alt={collection.name} />
        <div className='chung-banner-overlay'>
          <p>DISTRESSED</p>
          <h1>{collection.name.toUpperCase()}</h1>
          <span>Discover selected pieces from the Distressed collection.</span>
        </div>
      </div>

      <div className='chung-page'>
        <ProductFilterSidebar showFilter={showFilter} setShowFilter={setShowFilter} products={collectionProducts} advancedFilters={advancedFilters} setAdvancedFilters={setAdvancedFilters} showSubCategory subCategoryScope='Women' newArrivalOnly={newArrivalOnly} setNewArrivalOnly={setNewArrivalOnly} setPriceRange={setPriceRange} sortType={sortType} setSortType={setSortType} />

        <div className='chung-content'>
          <div className='chung-topbar'>
            <h1 className='title'><span className='title-text'>{collection.name.toUpperCase()} <span className='title-highlight'>COLLECTION</span></span><span className='title-line'></span></h1>
          </div>

          <div className='chung-product-grid'>
            {filterProducts.map((item) => <ProductItem key={item._id} name={item.name} id={item._id} price={item.price} image={item.image} />)}
          </div>
        </div>
      </div>
    </>
  )
}

export default WomenCollectionView
