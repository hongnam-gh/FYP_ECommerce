import axios from 'axios'
import React, { useEffect, useMemo, useState } from 'react'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'
import { FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import './List.css'

const getListProductImage = (product) => {
  const image = product.image?.[0]
  if (!image?.includes('/image/upload/')) return image
  return image.replace('/image/upload/', '/image/upload/c_pad,w_160,h_192,b_white,g_south/')
}

const List = ({ token }) => {
  const navigate = useNavigate()

  const [list, setList] = useState([])

  const [categories, setCategories] = useState([])

  const [subCategories, setSubCategories] = useState([])

  const [search, setSearch] = useState('')

  const [categoryFilter, setCategoryFilter] = useState('')

  const [subCategoryFilter, setSubCategoryFilter] = useState('')

  const [loading, setLoading] = useState(false)

  const fetchList = async () => {
    try {
      setLoading(true)
      const response = await axios.get(backendUrl + '/api/product/list')
      if (response.data.success) setList(response.data.products)
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

  const fetchListPageData = async () => {
    await Promise.all([fetchList(), fetchCategories(), fetchSubCategories()])
  }

  const editProduct = (productId) => {
    navigate(`/admin/edit-product/${productId}`)
  }

  const removeProduct = async (id) => {
    try {
      const response = await axios.post(backendUrl + '/api/product/remove', { id }, { headers: { token } })
      if (response.data.success) {
        toast.success(response.data.message)
        await fetchList()
      } else toast.error(response.data.message)
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const filteredProducts = useMemo(() => {
    return list.filter(item => {
      const keyword = search.toLowerCase()

      const matchedSearch = item.name?.toLowerCase().includes(keyword) || item.code?.toLowerCase().includes(keyword) || item.description?.toLowerCase().includes(keyword) || item.category?.toLowerCase().includes(keyword) || item.subCategory?.toLowerCase().includes(keyword)

      const matchedCategory = !categoryFilter || item.category === categoryFilter

      const matchedSubCategory = !subCategoryFilter || item.subCategory === subCategoryFilter

      return matchedSearch && matchedCategory && matchedSubCategory
    })
  }, [list, search, categoryFilter, subCategoryFilter])

  useEffect(() => {
    fetchListPageData()
  }, [])

  return (
    <div className='list-page'>
      
      <div className='list-page-header'>
        <div>
          <h1 className='list-page-title'>Product Management</h1>
          <p className='list-page-subtitle'>Review, refine, and maintain your product catalog with clean control.</p>
        </div>
        <button type='button' onClick={() => navigate('/admin/add')} className='list-add-product-btn'><FiPlus /> Add Product</button>
      </div>

      
      <div className='list-card'>
        <div className='list-toolbar'>
          <div className='list-control-row'>
            <input value={search} onChange={(e) => setSearch(e.target.value)} className='list-search' type='text' placeholder='Search product, code, category, sub category...' />

            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className='list-select'>
              <option value=''>Select Category</option>
              {categories.map(item => <option key={item._id} value={item.name}>{item.name}</option>)}
            </select>

            <select value={subCategoryFilter} onChange={(e) => setSubCategoryFilter(e.target.value)} className='list-select list-select-wide'>
              <option value=''>Select Sub Category</option>
              {subCategories.map(item => <option key={item._id} value={item.name}>{item.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Product list wrapper */}
      <div className='list-wrapper'>
        {/* Table title desktop */}
        <div className='list-header'>
          <b>Image</b>
          <b>Product</b>
          <b>Code</b>
          <b>Category</b>
          <b>Sub Category</b>
          <b>Price</b>
          <b className='list-header-action'>Action</b>
        </div>

        {/* Loading / empty state */}
        {loading ? <div className='list-empty'>Loading products...</div> : filteredProducts.length === 0 && <div className='list-empty'>Nothing found !</div>}

        {/* Product rows */}
        {!loading && filteredProducts.map((item) => (
          <div className='list-row' key={item._id}>
            
            <div className='list-image-box'>
              <img className='list-image' src={getListProductImage(item)} alt={item.name} />
            </div>

            {/* Product name and description */}
            <div className='list-product-info'>
              <p className='list-product-name'>{item.name}</p>
              <p className='list-product-desc'>{item.description}</p>
            </div>

            {/* Product code */}
            <p className='list-code'>{item.code || '—'}</p>

            {/* Product category */}
            <p className='list-text'>{item.category}</p>

            {/* Product sub category */}
            <p className='list-text'>{item.subCategory}</p>

            {/* Product price */}
            <p className='list-price'>{currency}{item.price}</p>

            {/* Edit and delete product buttons */}
            <div className='list-actions'>
              <button type='button' onClick={() => editProduct(item._id)} className='list-action-btn list-edit-btn' title='Edit product'><FiEdit2 /></button>
              <button type='button' onClick={() => removeProduct(item._id)} className='list-action-btn list-bin-btn' title='Delete product'><FiTrash2 /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default List
