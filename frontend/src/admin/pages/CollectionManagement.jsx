import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { FiEdit2, FiImage, FiPlus, FiSave, FiTrash2, FiX } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { backendUrl } from '../App'
import './CollectionManagement.css'

const collectionGenders = ['Unisex', 'Men', 'Women']

const createRouteName = (value) => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '')
}

const CollectionManagement = ({ token }) => {
  const navigate = useNavigate()
  const [collections, setCollections] = useState([])
  const [popupOpen, setPopupOpen] = useState(false)
  const [editingCollection, setEditingCollection] = useState(null)
  const [name, setName] = useState('')
  const [route, setRoute] = useState('')
  const [gender, setGender] = useState('Unisex')
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchManagementData = async () => {
    try {
      const collectionResponse = await axios.get(backendUrl + '/api/collection/list')

      if (!collectionResponse.data.success) return toast.error(collectionResponse.data.message)
      setCollections(collectionResponse.data.collections)
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const closePopup = () => {
    setPopupOpen(false)
    setEditingCollection(null)
    setName('')
    setRoute('')
    setGender('Unisex')
    setImage(null)
    setPreview('')
  }

  const openEditPopup = (event, collection) => {
    event.stopPropagation()
    setEditingCollection(collection)
    setName(collection.name)
    setRoute(collection.path.replace(/^\/collection\//i, ''))
    setGender(collection.gender || 'Unisex')
    setImage(null)
    setPreview(collection.image || '')
    setPopupOpen(true)
  }

  const selectImage = (event) => {
    const selectedImage = event.target.files[0]
    if (!selectedImage) return

    setImage(selectedImage)
    setPreview(URL.createObjectURL(selectedImage))
  }

  const saveCollection = async (event) => {
    event.preventDefault()
    if (!image && !editingCollection?.image) return toast.error('Collection card banner is required')

    try {
      setLoading(true)
      const formData = new FormData()
      if (editingCollection) formData.append('id', editingCollection._id)
      formData.append('name', name)
      formData.append('route', route)
      formData.append('gender', gender)
      if (image) formData.append('image', image)

      const response = await axios.post(backendUrl + '/api/collection/save', formData, { headers: { token } })
      if (response.data.success) {
        setCollections((prev) => editingCollection
          ? prev.map((item) => item._id === response.data.collection._id ? response.data.collection : item)
          : [...prev, response.data.collection])
        closePopup()
        toast.success(response.data.message)
      } else toast.error(response.data.message)
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const removeCollection = async (event, collection) => {
    event.stopPropagation()

    try {
      const response = await axios.post(backendUrl + '/api/collection/remove', { id: collection._id }, { headers: { token } })
      if (response.data.success) {
        setCollections((prev) => prev.filter((item) => item._id !== collection._id))
      } else toast.error(response.data.message)
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  useEffect(() => {
    fetchManagementData()
  }, [])

  return (
    <div className='manage-collection-page'>
      <div className='manage-collection-header'>
        <div>
          <h1>Collection Management</h1>
          <p>Create collection pages and manage their assigned products.</p>
        </div>
        <button type='button' onClick={() => setPopupOpen(true)}><FiPlus /> Add Collection</button>
      </div>

      <div className='manage-collection-list'>
        {collections.map((collection) => {
          const productCount = collection.products?.length || 0

          return (
            <div key={collection._id} role='button' tabIndex='0' onClick={() => navigate(`/admin/collection-management/${collection._id}`)} onKeyDown={(event) => event.key === 'Enter' && navigate(`/admin/collection-management/${collection._id}`)} className='manage-collection-card'>
              <div className='manage-collection-banner'>
                {collection.image ? <img src={collection.image} alt={collection.name} /> : <div><FiImage /><span>No banner</span></div>}
                <button type='button' onClick={(event) => removeCollection(event, collection)} className='manage-collection-remove'><FiTrash2 /></button>
              </div>
              <div className='manage-collection-card-info'>
                <div><p>{collection.name}</p><small>{collection.path} · {collection.gender || 'Unisex'} · {productCount} products</small></div>
                <button type='button' aria-label={`Edit ${collection.name}`} onClick={(event) => openEditPopup(event, collection)} className='manage-collection-edit'><FiEdit2 /></button>
              </div>
            </div>
          )
        })}
      </div>

      {popupOpen && (
        <div onClick={closePopup} className='manage-collection-popup-overlay'>
          <form onSubmit={saveCollection} onClick={(event) => event.stopPropagation()} className='manage-collection-popup'>
            <div className='manage-collection-popup-head'>
              <div><h2>{editingCollection ? 'Edit Collection' : 'Add Collection'}</h2><p>{editingCollection ? 'Update this collection page and its card banner.' : 'Create a new collection page and its card banner.'}</p></div>
              <button type='button' onClick={closePopup}><FiX /></button>
            </div>

            <label className='manage-collection-upload'>
              {preview ? <img src={preview} alt='Collection card banner preview' /> : <div><FiImage /><span>Choose collection card banner</span></div>}
              <input type='file' accept='image/*' onChange={selectImage} hidden />
            </label>

            <div className='manage-collection-fields'>
              <label><span>Collection Name</span><input value={name} onChange={(event) => setName(event.target.value)} type='text' placeholder='Hel lo' required /></label>
              <label><span>Collection Route</span><div className='manage-collection-route'><small>/collection/</small><input value={route} onChange={(event) => setRoute(createRouteName(event.target.value))} type='text' placeholder='Hel_lo' required /></div></label>
            </div>

            <div className='manage-collection-gender'>
              <span>Collection Gender</span>
              <div>{collectionGenders.map((item) => <button key={item} type='button' onClick={() => setGender(item)} className={gender === item ? 'active' : ''}>{item}</button>)}</div>
            </div>

            <div className='manage-collection-popup-actions'>
              <button type='button' onClick={closePopup}>Cancel</button>
              <button type='submit' disabled={loading}><FiSave /> {loading ? 'Saving...' : editingCollection ? 'Save Collection' : 'Create Collection'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default CollectionManagement
