import React, { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { FiArrowLeft, FiImage, FiPlus, FiX } from 'react-icons/fi'
import { useNavigate, useParams } from 'react-router-dom'
import { backendUrl, currency } from '../App'
import './CollectionManagementView.css'

const hasProduct = (collection, productId) => {
  return collection?.products?.some((item) => String(item?._id || item) === String(productId))
}

const getCollectionProductImage = (product, width, height) => {
  const image = product.image?.[0]
  if (!image?.includes('/image/upload/')) return image
  return image.replace('/image/upload/', `/image/upload/c_pad,w_${width},h_${height},b_white,g_south/`)
}

const CollectionManagementView = ({ token }) => {
  const navigate = useNavigate()
  const { collectionId } = useParams()
  const [collection, setCollection] = useState(null)
  const [collections, setCollections] = useState([])
  const [products, setProducts] = useState([])
  const [popupOpen, setPopupOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [subCategoryFilter, setSubCategoryFilter] = useState('')
  const [sortType, setSortType] = useState('default')
  const [loading, setLoading] = useState(false)
  const [updatingProductId, setUpdatingProductId] = useState('')

  const fetchCollectionData = useCallback(async () => {
    try {
      setLoading(true)
      const [collectionResponse, productResponse] = await Promise.all([
        axios.get(backendUrl + '/api/collection/list'),
        axios.get(backendUrl + '/api/product/list')
      ])

      if (!collectionResponse.data.success) return toast.error(collectionResponse.data.message)
      if (!productResponse.data.success) return toast.error(productResponse.data.message)

      const selectedCollection = collectionResponse.data.collections.find((item) => item._id === collectionId)
      if (!selectedCollection) {
        toast.error('Collection not found')
        navigate('/admin/collection-management', { replace: true })
        return
      }

      setCollection(selectedCollection)
      setCollections(collectionResponse.data.collections)
      setProducts(productResponse.data.products)
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }, [collectionId, navigate])

  const assignedProducts = useMemo(() => {
    return products.filter((product) => hasProduct(collection, product._id))
  }, [products, collection])

  const subCategories = useMemo(() => {
    return [...new Set(products.map((product) => product.subCategory).filter(Boolean))].sort((a, b) => a.localeCompare(b))
  }, [products])

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    const filtered = products.filter((product) => {
      const matchedSearch = !keyword || product.name?.toLowerCase().includes(keyword) || product.code?.toLowerCase().includes(keyword) || product.description?.toLowerCase().includes(keyword)
      const matchedSubCategory = !subCategoryFilter || product.subCategory === subCategoryFilter
      return matchedSearch && matchedSubCategory
    })

    if (sortType === 'subcategory') filtered.sort((a, b) => (a.subCategory || '').localeCompare(b.subCategory || ''))
    if (sortType === 'low-high') filtered.sort((a, b) => a.price - b.price)
    if (sortType === 'high-low') filtered.sort((a, b) => b.price - a.price)

    return filtered
  }, [products, search, subCategoryFilter, sortType])

  const closePopup = () => {
    setPopupOpen(false)
    setSearch('')
    setSubCategoryFilter('')
    setSortType('default')
  }

  const updateProductCollection = async (product, remove = false) => {
    try {
      setUpdatingProductId(product._id)
      const response = await axios.post(backendUrl + '/api/collection/assign-product', { collectionId, productId: product._id, remove }, { headers: { token } })
      if (response.data.success) {
        const updatedCollection = response.data.collections.find((item) => item._id === collectionId)
        setCollections(response.data.collections)
        setCollection(updatedCollection)
        toast.success(response.data.message)
      } else toast.error(response.data.message)
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setUpdatingProductId('')
    }
  }

  useEffect(() => {
    fetchCollectionData()
  }, [fetchCollectionData])

  useEffect(() => {
    if (!popupOpen) return

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') closePopup()
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [popupOpen])

  if (loading && !collection) return <div className='inside-collection-page'><div className='inside-collection-empty'>Loading collection...</div></div>
  if (!collection) return null

  return (
    <div className='inside-collection-page'>
      <div className='inside-collection-page-nav'>
        <button type='button' onClick={() => navigate('/admin/collection-management')}><FiArrowLeft /> Back to Collections</button>
      </div>

      <div className='inside-collection-banner-card'>
        <div className='inside-collection-banner-image'>
          {collection.image ? <img src={collection.image} alt={collection.name} /> : <div><FiImage /><span>No banner uploaded</span></div>}
        </div>
      </div>

      <section className='inside-collection-manage'>
        <div className='inside-collection-head'>
          <div>
            <small>Distressed Collection</small>
            <h2>{collection.name}</h2>
            <p>{assignedProducts.length} products assigned to this collection.</p>
          </div>
          <button type='button' onClick={() => setPopupOpen(true)}><FiPlus /> Add Product</button>
        </div>

        {assignedProducts.length === 0 ? <div className='inside-collection-empty'>Nothing Found</div> : (
          <div className='inside-collection-product-grid'>
            {assignedProducts.map((product) => (
              <div key={product._id} className='inside-collection-product-card'>
                <div className='inside-collection-product-image'><img src={getCollectionProductImage(product, 480, 576)} alt={product.name} /></div>
                <div className='inside-collection-product-info'>
                  <small>{product.subCategory}</small>
                  <p>{product.name}</p>
                  <span>{product.code}</span>
                  <div><b>{currency}{product.price}</b><button type='button' disabled={updatingProductId === product._id} onClick={() => updateProductCollection(product, true)}>{updatingProductId === product._id ? 'Removing...' : 'Remove'}</button></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {popupOpen && (
        <div onClick={closePopup} className='inside-collection-popup-overlay'>
          <div onClick={(event) => event.stopPropagation()} className='inside-collection-popup'>
            <div className='inside-collection-popup-head'>
              <div><small>All Products</small><h2>Add Products to {collection.name}</h2></div>
              <button type='button' onClick={closePopup}><FiX /></button>
            </div>

            <div className='inside-collection-popup-toolbar'>
              <input value={search} onChange={(event) => setSearch(event.target.value)} type='text' placeholder='Search product name, code...' />

              <select value={subCategoryFilter} onChange={(event) => setSubCategoryFilter(event.target.value)}>
                <option value=''>All Sub Categories</option>
                {subCategories.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>

              <select value={sortType} onChange={(event) => setSortType(event.target.value)}>
                <option value='default'>Sort by: Default</option>
                <option value='subcategory'>Sort by: Sub Category</option>
                <option value='low-high'>Price: Low to High</option>
                <option value='high-low'>Price: High to Low</option>
              </select>
            </div>

            <div className='inside-collection-popup-list'>
              {filteredProducts.length === 0 ? <div className='inside-collection-empty'>Nothing Found</div> : filteredProducts.map((product) => {
                const assignedCollection = collections.find((item) => hasProduct(item, product._id))
                const isAdded = assignedCollection?._id === collection._id

                return (
                  <div key={product._id} className='inside-collection-popup-product'>
                    <div className='inside-collection-popup-image'><img src={getCollectionProductImage(product, 160, 192)} alt={product.name} /></div>
                    <div className='inside-collection-popup-info'>
                      <small>{product.subCategory}</small>
                      <p>{product.name}</p>
                      <span>{assignedCollection ? `In ${assignedCollection.name}` : 'Not assigned'}</span>
                    </div>
                    <b>{currency}{product.price}</b>
                    <button type='button' disabled={isAdded || updatingProductId === product._id} onClick={() => updateProductCollection(product)}>{updatingProductId === product._id ? 'Saving...' : isAdded ? 'Added' : assignedCollection ? 'Move Here' : 'Add'}</button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CollectionManagementView
