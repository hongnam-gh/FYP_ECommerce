import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'
import './Inventory.css'

const getInventoryProductImage = (product) => {
  const image = product.image?.[0]
  if (!image?.includes('/image/upload/')) return image
  return image.replace('/image/upload/', '/image/upload/c_pad,w_160,h_192,b_white,g_south/')
}

const isValidStockValue = (value) => {
  return /^\d+$/.test(String(value).trim())
}

const Inventory = ({ token }) => {
  const [inventories, setInventories] = useState([])

  const [categories, setCategories] = useState([])

  const [subCategories, setSubCategories] = useState([])

  const [search, setSearch] = useState('')

  const [filter, setFilter] = useState('all')

  const [categoryFilter, setCategoryFilter] = useState('')

  const [subCategoryFilter, setSubCategoryFilter] = useState('')

  const [loading, setLoading] = useState(false)

  const [changedProductIds, setChangedProductIds] = useState([])

  const [updating, setUpdating] = useState(false)

  const fetchInventories = async () => {
    try {
      setLoading(true)

      const response = await axios.get(backendUrl + '/api/inventory/list', { headers: { token } })

      if (response.data.success) setInventories(response.data.inventories)
      else toast.error(response.data.message)
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await axios.get(backendUrl + '/api/category/list')

      if (response.data.success) setCategories([...response.data.categories].sort((a, b) => (a.date || 0) - (b.date || 0)))
      else toast.error(response.data.message)
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const fetchSubCategories = async () => {
    try {
      const response = await axios.get(backendUrl + '/api/sub-category/list')

      if (response.data.success) setSubCategories([...response.data.subCategories].sort((a, b) => (a.date || 0) - (b.date || 0)))
      else toast.error(response.data.message)
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const fetchInventoryPageData = async () => {
    await Promise.all([fetchInventories(), fetchCategories(), fetchSubCategories()])
  }

  const stockChangeHandler = (productId, size, value) => {
    setInventories(prev => prev.map(item => item.productId === productId ? { ...item, stock: { ...item.stock, [size]: value } } : item))
    setChangedProductIds(prev => prev.includes(productId) ? prev : [...prev, productId])
  }

  const updateInventoriesHandler = async () => {
    try {
      setUpdating(true)

      const changedInventories = inventories.filter(item => changedProductIds.includes(item.productId))
      const responses = await Promise.all(changedInventories.map(item => {
        const hasInvalidStock = Object.values(item.stock || {}).some(value => !isValidStockValue(value))
        if (hasInvalidStock) throw new Error('Stock must be a whole number')

        const cleanStock = Object.keys(item.stock || {}).reduce((data, size) => ({ ...data, [size]: Number(item.stock[size]) }), {})
        return axios.post(backendUrl + '/api/inventory/update', { productId: item.productId, stock: cleanStock }, { headers: { token } })
      }))

      const failedResponse = responses.find(response => !response.data.success)
      if (failedResponse) return toast.error(failedResponse.data.message)

      toast.success('Inventory updated successfully')
      setChangedProductIds([])
      await fetchInventories()
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setUpdating(false)
    }
  }

  const getInventoryStatus = (stock) => {
    const quantities = Object.values(stock || {}).map(item => Number(item) || 0)

    if (quantities.length === 0 || quantities.every(quantity => quantity === 0)) return 'out'
    if (quantities.some(quantity => quantity > 0 && quantity <= 5)) return 'low'

    return 'in'
  }

  const getStockGroups = (stock, sizes = []) => {
    const allSizes = sizes.length > 0 ? sizes : Object.keys(stock || {})
    const groups = allSizes.reduce((data, size) => {
      const quantity = Number(stock?.[size]) || 0

      if (quantity === 0) data.out.push(size)
      else if (quantity > 0 && quantity <= 5) data.low.push(size)
      else data.in.push(size)

      return data
    }, { in: [], low: [], out: [] })

    return {
      inText: groups.in.length > 0 ? groups.in.join(', ') : '---',
      lowText: groups.low.length > 0 ? groups.low.join(', ') : '---',
      outText: groups.out.length > 0 ? groups.out.join(', ') : '---'
    }
  }

  const getTotalStock = (stock) => {
    return Object.values(stock || {}).reduce((total, quantity) => total + (Number(quantity) || 0), 0)
  }

  const filteredInventories = useMemo(() => {
    return inventories.filter(item => {
      const product = item.product || {}
      const keyword = search.toLowerCase()

      const matchedSearch = product.name?.toLowerCase().includes(keyword) || product.category?.toLowerCase().includes(keyword) || product.subCategory?.toLowerCase().includes(keyword)

      const matchedStatus = filter === 'all' || getInventoryStatus(item.stock) === filter

      const matchedCategory = !categoryFilter || product.category === categoryFilter

      const matchedSubCategory = !subCategoryFilter || product.subCategory === subCategoryFilter

      return matchedSearch && matchedStatus && matchedCategory && matchedSubCategory
    })
  }, [inventories, search, filter, categoryFilter, subCategoryFilter])

  useEffect(() => {
    fetchInventoryPageData()
  }, [])

  return (
    <div className='inventory-page'>
      
      <div className='inventory-header'>
        <div>
          <h1 className='inventory-title'>Inventory Management</h1>
          <p className='inventory-subtitle'>Manage product stock, low stock alerts, and out of stock items.</p>
        </div>
      </div>

      
      <div className='inventory-card'>
        <div className='inventory-toolbar'>
          <div className='inventory-control-row'>
            <input value={search} onChange={(e) => setSearch(e.target.value)} className='inventory-search' type='text' placeholder='Search product, category, sub category...' />

            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className='inventory-select'>
              <option value=''>Select Category</option>
              {categories.map(item => <option key={item._id} value={item.name}>{item.name}</option>)}
            </select>

            <select value={subCategoryFilter} onChange={(e) => setSubCategoryFilter(e.target.value)} className='inventory-select inventory-select-wide'>
              <option value=''>Select Sub Category</option>
              {subCategories.map(item => <option key={item._id} value={item.name}>{item.name}</option>)}
            </select>
          </div>

          
          <div className='inventory-filter-list'>
            {[{ id: 'all', text: 'All' }, { id: 'in', text: 'In Stock' }, { id: 'low', text: 'Low Stock' }, { id: 'out', text: 'Out of Stock' }].map(item => (
              <button key={item.id} type='button' onClick={() => setFilter(item.id)} className={`inventory-filter-btn ${filter === item.id ? 'inventory-filter-active' : ''}`}>{item.text}</button>
            ))}
          </div>
        </div>
      </div>

      
      <div className='inventory-list'>
        {loading ? <div className='inventory-empty'>Loading inventory...</div> : filteredInventories.length > 0 ? filteredInventories.map((item) => {
          const product = item.product || {}
          const totalStock = getTotalStock(item.stock)
          const stockGroups = getStockGroups(item.stock, product.sizes || [])

          return (
            <div key={item._id} className='inventory-product-card'>
              
              <div className='inventory-product-head'>
                <div className='inventory-product-image-box'>
                  <img className='inventory-product-image' src={getInventoryProductImage(product)} alt={product.name || ''} />
                </div>

                <div className='inventory-product-info'>
                  <h2 className='inventory-product-name'>{product.name}</h2>
                  <p className='inventory-product-meta'>{product.category} / {product.subCategory}</p>
                  <p className='inventory-product-price'>{currency}{product.price}</p>
                </div>

                
                <div className='inventory-product-status'>
                  <div className='inventory-badge-row'>
                    <span className='inventory-badge inventory-badge-in'>In Stock: {stockGroups.inText}</span>
                    <span className='inventory-badge inventory-badge-low'>Low Stock: {stockGroups.lowText}</span>
                    <span className='inventory-badge inventory-badge-out'>Out of Stock: {stockGroups.outText}</span>
                  </div>
                  <p className='inventory-total-stock'>Total: {totalStock}</p>
                </div>
              </div>

              
              <div className='inventory-stock-grid'>
                {(product.sizes || Object.keys(item.stock || {})).map(size => (
                  <div key={size} className='inventory-stock-item'>
                    <p className='inventory-stock-size'>{size}</p>
                    <input value={item.stock?.[size] ?? 0} onChange={(e) => stockChangeHandler(item.productId, size, e.target.value)} className='inventory-stock-input' type='number' min='0' />
                  </div>
                ))}
              </div>
            </div>
          )
        }) : <div className='inventory-empty'>Nothing found !</div>}
      </div>

      
      <button type='button' onClick={updateInventoriesHandler} disabled={updating || changedProductIds.length === 0} className='inventory-update-btn'>{updating ? 'Updating...' : 'Update Inventory'}</button>
    </div>
  )
}

export default Inventory
