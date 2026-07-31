import React, { useEffect, useState } from 'react'
import { assets } from '../assets/assets'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'
import './Add.css'

const Add = ({ token }) => {
  const [image1, setImage1] = useState(false)
  const [image2, setImage2] = useState(false)
  const [image3, setImage3] = useState(false)
  const [image4, setImage4] = useState(false)

  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('')
  const [subCategory, setSubCategory] = useState('')
  const [selectedMaterials, setSelectedMaterials] = useState([])
  const [selectedColors, setSelectedColors] = useState([])
  const [collectionId, setCollectionId] = useState('')
  const [newarrival, setNewarrival] = useState(false)
  const [sizes, setSizes] = useState([])

  const [categories, setCategories] = useState([])
  const [newCategory, setNewCategory] = useState('')
  const [editCategoryId, setEditCategoryId] = useState('')
  const [editCategoryName, setEditCategoryName] = useState('')

  const [subCategories, setSubCategories] = useState([])
  const [collections, setCollections] = useState([])
  const [newSubCategory, setNewSubCategory] = useState('')
  const [editSubCategoryId, setEditSubCategoryId] = useState('')
  const [editSubCategoryName, setEditSubCategoryName] = useState('')

  const [materials, setMaterials] = useState([])
  const [newMaterial, setNewMaterial] = useState('')
  const [editMaterialId, setEditMaterialId] = useState('')
  const [editMaterialName, setEditMaterialName] = useState('')

  const [colors, setColors] = useState([])
  const [newColor, setNewColor] = useState('')
  const [editColorId, setEditColorId] = useState('')
  const [editColorName, setEditColorName] = useState('')

  const imageList = [{ id: 'image1', image: image1, setImage: setImage1 }, { id: 'image2', image: image2, setImage: setImage2 }, { id: 'image3', image: image3, setImage: setImage3 }, { id: 'image4', image: image4, setImage: setImage4 }]
  const availableCollections = collections

  const validatePrice = (value) => {
    const numberValue = Number(value)
    if (!value) return 'Product price is required.'
    if (Number.isNaN(numberValue)) return 'Price must be a valid number'
    if (numberValue <= 0) return 'Price must be greater than 0'
    if (numberValue > 10000) return 'Price cannot be greater than 10,000'
    return ''
  }

  const validateCode = (value) => {
    if (!value.trim()) return 'Product code is required.'
    if (!/^[A-Z0-9]+$/.test(value.trim())) return 'Product code can only contain uppercase letters and numbers.'
    return ''
  }

  const fetchCategories = async () => {
    try {
      const response = await axios.get(backendUrl + '/api/category/list')
      if (response.data.success) {
        setCategories(response.data.categories)
        if (!category && response.data.categories.length > 0) setCategory(response.data.categories[0].name)
      } else toast.error(response.data.message)
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const fetchSubCategories = async () => {
    try {
      const response = await axios.get(backendUrl + '/api/sub-category/list')
      if (response.data.success) {
        const sortedSubCategories = [...response.data.subCategories].sort((a, b) => a._id.localeCompare(b._id))
        setSubCategories(sortedSubCategories)
        if (!subCategory && sortedSubCategories.length > 0) setSubCategory(sortedSubCategories[0].name)
      } else toast.error(response.data.message)
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const fetchCollections = async () => {
    try {
      const response = await axios.get(backendUrl + '/api/collection/list')
      if (response.data.success) setCollections(response.data.collections)
      else toast.error(response.data.message)
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const fetchMaterials = async () => {
    try {
      const response = await axios.get(backendUrl + '/api/material/list')
      if (response.data.success) {
        setMaterials(response.data.materials)
      } else toast.error(response.data.message)
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const fetchColors = async () => {
    try {
      const response = await axios.get(backendUrl + '/api/color/list')
      if (response.data.success) {
        setColors(response.data.colors)
      } else toast.error(response.data.message)
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const changeCategory = (value) => {
    setCategory(value)
  }

  const toggleProductOption = (value, selectedOptions, setSelectedOptions) => {
    setSelectedOptions(selectedOptions.includes(value) ? selectedOptions.filter((item) => item !== value) : [...selectedOptions, value])
  }

  const addCategoryHandler = async () => {
    try {
      if (!newCategory.trim()) return toast.error('Category name is required')
      const response = await axios.post(backendUrl + '/api/category/add', { name: newCategory.trim() }, { headers: { token } })
      if (response.data.success) {
        toast.success(response.data.message)
        setNewCategory('')
        changeCategory(response.data.category.name)
        fetchCategories()
      } else toast.error(response.data.message)
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const updateCategoryHandler = async () => {
    try {
      if (!editCategoryId || !editCategoryName.trim()) return toast.error('Category data is required')
      const oldName = categories.find(item => item._id === editCategoryId)?.name
      const response = await axios.post(backendUrl + '/api/category/update', { id: editCategoryId, name: editCategoryName.trim() }, { headers: { token } })
      if (response.data.success) {
        toast.success(response.data.message)
        if (category === oldName) changeCategory(response.data.category.name)
        setEditCategoryId('')
        setEditCategoryName('')
        fetchCategories()
      } else toast.error(response.data.message)
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const deleteCategoryHandler = async (id, categoryName) => {
    try {
      const response = await axios.post(backendUrl + '/api/category/delete', { id }, { headers: { token } })
      if (response.data.success) {
        toast.success(response.data.message)
        if (category === categoryName) changeCategory('')
        fetchCategories()
      } else toast.error(response.data.message)
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const addSubCategoryHandler = async () => {
    try {
      if (!newSubCategory.trim()) return toast.error('Sub category name is required')
      const response = await axios.post(backendUrl + '/api/sub-category/add', { name: newSubCategory.trim() }, { headers: { token } })
      if (response.data.success) {
        toast.success(response.data.message)
        setNewSubCategory('')
        setSubCategory(response.data.subCategory.name)
        fetchSubCategories()
      } else toast.error(response.data.message)
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const updateSubCategoryHandler = async () => {
    try {
      if (!editSubCategoryId || !editSubCategoryName.trim()) return toast.error('Sub category data is required')
      const oldName = subCategories.find(item => item._id === editSubCategoryId)?.name
      const response = await axios.post(backendUrl + '/api/sub-category/update', { id: editSubCategoryId, name: editSubCategoryName.trim() }, { headers: { token } })
      if (response.data.success) {
        toast.success(response.data.message)
        if (subCategory === oldName) setSubCategory(response.data.subCategory.name)
        setEditSubCategoryId('')
        setEditSubCategoryName('')
        fetchSubCategories()
      } else toast.error(response.data.message)
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const deleteSubCategoryHandler = async (id, subCategoryName) => {
    try {
      const response = await axios.post(backendUrl + '/api/sub-category/delete', { id }, { headers: { token } })
      if (response.data.success) {
        toast.success(response.data.message)
        if (subCategory === subCategoryName) setSubCategory('')
        fetchSubCategories()
      } else toast.error(response.data.message)
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const addMaterialHandler = async () => {
    try {
      if (!newMaterial.trim()) return toast.error('Material name is required')
      const response = await axios.post(backendUrl + '/api/material/add', { name: newMaterial.trim() }, { headers: { token } })
      if (response.data.success) {
        toast.success(response.data.message)
        setNewMaterial('')
        setSelectedMaterials(prev => [...new Set([...prev, response.data.material.name])])
        fetchMaterials()
      } else toast.error(response.data.message)
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const updateMaterialHandler = async () => {
    try {
      if (!editMaterialId || !editMaterialName.trim()) return toast.error('Material data is required')
      const oldName = materials.find(item => item._id === editMaterialId)?.name
      const response = await axios.post(backendUrl + '/api/material/update', { id: editMaterialId, name: editMaterialName.trim() }, { headers: { token } })
      if (response.data.success) {
        toast.success(response.data.message)
        setSelectedMaterials(prev => prev.map((item) => item === oldName ? response.data.material.name : item))
        setEditMaterialId('')
        setEditMaterialName('')
        fetchMaterials()
      } else toast.error(response.data.message)
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const deleteMaterialHandler = async (id, materialName) => {
    try {
      const response = await axios.post(backendUrl + '/api/material/delete', { id }, { headers: { token } })
      if (response.data.success) {
        toast.success(response.data.message)
        setSelectedMaterials(prev => prev.filter((item) => item !== materialName))
        fetchMaterials()
      } else toast.error(response.data.message)
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const addColorHandler = async () => {
    try {
      if (!newColor.trim()) return toast.error('Color name is required')
      const response = await axios.post(backendUrl + '/api/color/add', { name: newColor.trim() }, { headers: { token } })
      if (response.data.success) {
        toast.success(response.data.message)
        setNewColor('')
        setSelectedColors(prev => [...new Set([...prev, response.data.color.name])])
        fetchColors()
      } else toast.error(response.data.message)
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const updateColorHandler = async () => {
    try {
      if (!editColorId || !editColorName.trim()) return toast.error('Color data is required')
      const oldName = colors.find(item => item._id === editColorId)?.name
      const response = await axios.post(backendUrl + '/api/color/update', { id: editColorId, name: editColorName.trim() }, { headers: { token } })
      if (response.data.success) {
        toast.success(response.data.message)
        setSelectedColors(prev => prev.map((item) => item === oldName ? response.data.color.name : item))
        setEditColorId('')
        setEditColorName('')
        fetchColors()
      } else toast.error(response.data.message)
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const deleteColorHandler = async (id, colorName) => {
    try {
      const response = await axios.post(backendUrl + '/api/color/delete', { id }, { headers: { token } })
      if (response.data.success) {
        toast.success(response.data.message)
        setSelectedColors(prev => prev.filter((item) => item !== colorName))
        fetchColors()
      } else toast.error(response.data.message)
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const onSubmitHandler = async (e) => {
    e.preventDefault()

    try {
      if (!image1 || !image2 || !image3 || !image4) return toast.error('Please upload all 4 product images before adding this product.')
      if (!name.trim()) return toast.error('Product name is required.')

      const codeError = validateCode(code)
      if (codeError) return toast.error(codeError)

      if (!description.trim()) return toast.error('Product description is required.')
      if (!category) return toast.error('Please select a category.')
      if (!subCategory) return toast.error('Please create a sub category.')

      const priceError = validatePrice(price)
      if (priceError) return toast.error(priceError)

      if (selectedMaterials.length === 0) return toast.error('Please select a material.')
      if (selectedColors.length === 0) return toast.error('Please select a color.')
      if (sizes.length === 0) return toast.error('Please select at least one product size.')


      const formData = new FormData()
      formData.append('name', name)
      formData.append('code', code.trim())
      formData.append('description', description)
      formData.append('price', Number(price))
      formData.append('material', JSON.stringify(selectedMaterials))
      formData.append('color', JSON.stringify(selectedColors))
      formData.append('category', category)
      formData.append('subcategory', subCategory)
      if (collectionId) formData.append('collectionId', collectionId)
      formData.append('newarrival', newarrival)
      formData.append('sizes', JSON.stringify(sizes))
      formData.append('image1', image1)
      formData.append('image2', image2)
      formData.append('image3', image3)
      formData.append('image4', image4)

      const response = await axios.post(backendUrl + '/api/product/add', formData, { headers: { token } })

      if (response.data.success) {
        toast.success(response.data.message)
        setName('')
        setCode('')
        setDescription('')
        setImage1(false)
        setImage2(false)
        setImage3(false)
        setImage4(false)
        setPrice('')
        setSelectedMaterials([])
        setSelectedColors([])
        setCollectionId('')
        setSizes([])
        setNewarrival(false)
      } else toast.error(response.data.message)
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  useEffect(() => {
    fetchCategories()
    fetchSubCategories()
    fetchCollections()
    fetchMaterials()
    fetchColors()
  }, [])

  return (
    <form onSubmit={onSubmitHandler} className='add-form'>
      {/* Page header */}
      <div className='add-header'>
        <h1 className='add-title'>Add Product</h1>
        <p className='add-subtitle'>Create products and manage their available options in one place.</p>
      </div>

      {/* Main layout */}
      <div className='add-layout'>
        {/* Left column */}
        <div className='add-left'>
          {/* Upload images */}
          <div className='add-card'>
            <p className='add-card-title'>Upload Images</p>

            <div className='add-image-grid'>
              {imageList.map((item) => (
                <div key={item.id} className='add-image-box'>
                  <label htmlFor={item.id} className='add-image-label'>
                    <img className='add-image' src={!item.image ? assets.upload_area : URL.createObjectURL(item.image)} alt='' />
                    <input onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; item.setImage(file) }} type='file' id={item.id} accept='image/*' hidden />
                  </label>

                  {item.image && <button type='button' onClick={() => item.setImage(false)} className='add-image-remove-btn'>×</button>}
                </div>
              ))}
            </div>
          </div>

          {/* Product information */}
          <div className='add-card'>
            <p className='add-card-title'>Product Information</p>

            <div className='add-fields'>
              <div>
                <p className='add-label'>Product Name</p>
                <input onChange={(e) => setName(e.target.value)} value={name} className='add-input' type='text' placeholder='Type Here' />
              </div>

              <div className='add-code-grid'>
                <div>
                  <p className='add-label'>Product Code</p>
                  <input onChange={(e) => setCode(e.target.value.toUpperCase())} value={code} className='add-input' type='text' placeholder='WS01' maxLength={30} />
                </div>

                <div>
                  <p className='add-label'>Collection (Optional)</p>
                  <select onChange={(e) => setCollectionId(e.target.value)} value={collectionId} className='add-select'>
                    <option value=''>No collection</option>
                    {availableCollections.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <p className='add-label'>Product Description</p>
                <textarea onChange={(e) => setDescription(e.target.value)} value={description} className='add-textarea' placeholder='Write Here' />
              </div>

              <div className='add-info-grid'>
                <div>
                  <p className='add-label'>Category</p>
                  <select onChange={(e) => changeCategory(e.target.value)} value={category} className='add-select'>
                    {categories.length > 0 ? categories.map((item) => <option key={item._id} value={item.name}>{item.name}</option>) : <option value=''>No category</option>}
                  </select>
                </div>

                <div>
                  <p className='add-label'>Sub Category</p>
                  <select onChange={(e) => setSubCategory(e.target.value)} value={subCategory} className='add-select'>
                    {subCategories.length > 0 ? subCategories.map((item) => <option key={item._id} value={item.name}>{item.name}</option>) : <option value=''>No sub category</option>}
                  </select>
                </div>

                <div>
                  <p className='add-label'>Price</p>
                  <input onChange={(e) => setPrice(e.target.value)} value={price} className='add-input' type='number' placeholder='1000$' />
                </div>

              </div>
            </div>
          </div>

          {/* Product options */}
          <div className='add-card'>
            <p className='add-card-title'>Product Options</p>

            <div className='add-options-grid'>
              <div>
                <p className='add-label'>Materials</p>
                <div className='add-option-list'>
                  {materials.length > 0 ? materials.map((item) => <button key={item._id} type='button' onClick={() => toggleProductOption(item.name, selectedMaterials, setSelectedMaterials)} className={`add-option-btn ${selectedMaterials.includes(item.name) ? 'active' : ''}`}>{item.name}</button>) : <p className='add-option-empty'>No material</p>}
                </div>
              </div>

              <div>
                <p className='add-label'>Colors</p>
                <div className='add-option-list'>
                  {colors.length > 0 ? colors.map((item) => <button key={item._id} type='button' onClick={() => toggleProductOption(item.name, selectedColors, setSelectedColors)} className={`add-option-btn ${selectedColors.includes(item.name) ? 'active' : ''}`}>{item.name}</button>) : <p className='add-option-empty'>No color</p>}
                </div>
              </div>
            </div>

            <div>
              <p className='add-label'>Product Sizes</p>
              <div className='add-size-list'>
                {['S', 'M', 'L', 'XL', 'Free Size'].map((item) => (
                  <button key={item} type='button' onClick={() => setSizes(prev => { const updatedSizes = prev.includes(item) ? prev.filter(size => size !== item) : [...prev, item]; return ['S', 'M', 'L', 'XL', 'Free Size'].filter(size => updatedSizes.includes(size)) })} className={`add-size-btn ${sizes.includes(item) ? 'add-size-active' : 'add-size-normal'}`}>{item}</button>
                ))}
              </div>
            </div>

            <div className='add-bestseller'>
              <input onChange={() => setNewarrival(prev => !prev)} checked={newarrival} type='checkbox' id='newarrival' className='add-checkbox' />
              <label className='add-bestseller-label' htmlFor='newarrival'>Mark as New Arrival</label>
            </div>
          </div>

          {/* Submit product */}
          <button type='submit' className='add-submit-btn'>ADD PRODUCT</button>
        </div>

        {/* Right column */}
        <div className='add-right'>
          {/* Manage categories */}
          <div className='add-card'>
            <div className='add-manage-head'>
              <p className='add-manage-title'>Manage Categories</p>
              <p className='add-manage-subtitle'>Add, edit, delete category.</p>
            </div>

            <div className='add-manage-form'>
              <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className='add-manage-input' type='text' placeholder='Enter New Category' />
              <button type='button' onClick={addCategoryHandler} className='add-manage-add-btn'>Add</button>
            </div>

            <div className='add-manage-list-wrap'>
              <div className='add-manage-list'>
                {categories.length > 0 ? categories.map((item) => (
                  <div key={item._id} className='add-manage-item'>
                    {editCategoryId === item._id ? (
                      <div className='add-edit-box'>
                        <input value={editCategoryName} onChange={(e) => setEditCategoryName(e.target.value)} className='add-edit-input' type='text' />

                        <div className='add-edit-actions'>
                          <button type='button' onClick={updateCategoryHandler} className='add-small-btn add-save-btn'>Save</button>
                          <button type='button' onClick={() => { setEditCategoryId(''); setEditCategoryName('') }} className='add-small-btn add-cancel-btn'>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className='add-manage-row'>
                        <p className='add-manage-name'>{item.name}</p>
                        <button type='button' onClick={() => { setEditCategoryId(item._id); setEditCategoryName(item.name) }} className='add-edit-btn'>Edit</button>
                        <button type='button' onClick={() => deleteCategoryHandler(item._id, item.name)} className='add-delete-btn'>Delete</button>
                      </div>
                    )}
                  </div>
                )) : <div className='add-empty'>No category yet.</div>}
              </div>
            </div>
          </div>

          {/* Manage sub categories */}
          <div className='add-card'>
            <div className='add-manage-head'>
              <p className='add-manage-title'>Manage Sub Categories</p>
              <p className='add-manage-subtitle'>Add, edit, delete sub category.</p>
            </div>

            <div className='add-manage-form'>
              <input value={newSubCategory} onChange={(e) => setNewSubCategory(e.target.value)} className='add-manage-input' type='text' placeholder='Enter New Sub Category' />
              <button type='button' onClick={addSubCategoryHandler} className='add-manage-add-btn'>Add</button>
            </div>

            <div className='add-manage-list-wrap'>
              <div className='add-manage-list'>
                {subCategories.length > 0 ? subCategories.map((item) => (
                  <div key={item._id} className='add-manage-item'>
                    {editSubCategoryId === item._id ? (
                      <div className='add-edit-box'>
                        <input value={editSubCategoryName} onChange={(e) => setEditSubCategoryName(e.target.value)} className='add-edit-input' type='text' />

                        <div className='add-edit-actions'>
                          <button type='button' onClick={updateSubCategoryHandler} className='add-small-btn add-save-btn'>Save</button>
                          <button type='button' onClick={() => { setEditSubCategoryId(''); setEditSubCategoryName('') }} className='add-small-btn add-cancel-btn'>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className='add-manage-row'>
                        <p className='add-manage-name'>{item.name}</p>
                        <button type='button' onClick={() => { setEditSubCategoryId(item._id); setEditSubCategoryName(item.name) }} className='add-edit-btn'>Edit</button>
                        <button type='button' onClick={() => deleteSubCategoryHandler(item._id, item.name)} className='add-delete-btn'>Delete</button>
                      </div>
                    )}
                  </div>
                )) : <div className='add-empty'>No sub category yet.</div>}
              </div>
            </div>
          </div>

          {/* Manage materials */}
          <div className='add-card'>
            <div className='add-manage-head'>
              <p className='add-manage-title'>Manage Materials</p>
              <p className='add-manage-subtitle'>Add, edit, delete material.</p>
            </div>

            <div className='add-manage-form'>
              <input value={newMaterial} onChange={(e) => setNewMaterial(e.target.value)} className='add-manage-input' type='text' placeholder='Enter New Material' />
              <button type='button' onClick={addMaterialHandler} className='add-manage-add-btn'>Add</button>
            </div>

            <div className='add-manage-list-wrap'>
              <div className='add-manage-list'>
                {materials.length > 0 ? materials.map((item) => (
                  <div key={item._id} className='add-manage-item'>
                    {editMaterialId === item._id ? (
                      <div className='add-edit-box'>
                        <input value={editMaterialName} onChange={(e) => setEditMaterialName(e.target.value)} className='add-edit-input' type='text' />

                        <div className='add-edit-actions'>
                          <button type='button' onClick={updateMaterialHandler} className='add-small-btn add-save-btn'>Save</button>
                          <button type='button' onClick={() => { setEditMaterialId(''); setEditMaterialName('') }} className='add-small-btn add-cancel-btn'>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className='add-manage-row'>
                        <p className='add-manage-name'>{item.name}</p>
                        <button type='button' onClick={() => { setEditMaterialId(item._id); setEditMaterialName(item.name) }} className='add-edit-btn'>Edit</button>
                        <button type='button' onClick={() => deleteMaterialHandler(item._id, item.name)} className='add-delete-btn'>Delete</button>
                      </div>
                    )}
                  </div>
                )) : <div className='add-empty'>No material yet.</div>}
              </div>
            </div>
          </div>

          {/* Manage colors */}
          <div className='add-card'>
            <div className='add-manage-head'>
              <p className='add-manage-title'>Manage Colors</p>
              <p className='add-manage-subtitle'>Add, edit, delete color.</p>
            </div>

            <div className='add-manage-form'>
              <input value={newColor} onChange={(e) => setNewColor(e.target.value)} className='add-manage-input' type='text' placeholder='Enter New Color' />
              <button type='button' onClick={addColorHandler} className='add-manage-add-btn'>Add</button>
            </div>

            <div className='add-manage-list-wrap'>
              <div className='add-manage-list'>
                {colors.length > 0 ? colors.map((item) => (
                  <div key={item._id} className='add-manage-item'>
                    {editColorId === item._id ? (
                      <div className='add-edit-box'>
                        <input value={editColorName} onChange={(e) => setEditColorName(e.target.value)} className='add-edit-input' type='text' />

                        <div className='add-edit-actions'>
                          <button type='button' onClick={updateColorHandler} className='add-small-btn add-save-btn'>Save</button>
                          <button type='button' onClick={() => { setEditColorId(''); setEditColorName('') }} className='add-small-btn add-cancel-btn'>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className='add-manage-row'>
                        <p className='add-manage-name'>{item.name}</p>
                        <button type='button' onClick={() => { setEditColorId(item._id); setEditColorName(item.name) }} className='add-edit-btn'>Edit</button>
                        <button type='button' onClick={() => deleteColorHandler(item._id, item.name)} className='add-delete-btn'>Delete</button>
                      </div>
                    )}
                  </div>
                )) : <div className='add-empty'>No color yet.</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}

export default Add
