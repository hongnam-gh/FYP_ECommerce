import React, { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { FiArrowLeft, FiEdit2, FiImage, FiSave, FiX } from 'react-icons/fi'
import { useNavigate, useParams } from 'react-router-dom'
import { assets } from '../../assets/assets'
import { backendUrl } from '../App'
import './BannerManagement.css'

const bannerPages = [
  { value: 'home', label: 'Home', title: 'LATEST RIVALS', eyebrow: 'DISTRESSED TRADEMARK', subtitle: '' },
  { value: 'new-arrivals-women', label: 'New Arrivals Women', title: 'WOMEN NEW ARRIVALS' },
  { value: 'new-arrivals-men', label: 'New Arrivals Men', title: 'MEN NEW ARRIVALS' },
  { value: 'new-arrivals-accessories', label: 'New Arrivals Accessories', title: 'ACCESSORIES NEW ARRIVALS' },
  { value: 'discover-fashion', label: 'Discover Fashion', title: 'DISCOVER FASHION' },
  { value: 'women-view-all', label: 'Women View All', title: 'WOMEN COLLECTION' },
  { value: 'women-tops-shirts', label: 'Women Tops & Shirts', title: 'WOMEN TOPS & SHIRTS' },
  { value: 'women-bottomwear', label: 'Women Bottomwear', title: 'WOMEN BOTTOMWEAR' },
  { value: 'women-outerwears', label: 'Women Outerwears', title: 'WOMEN OUTERWEARS & JACKETS' },
  { value: 'men-view-all', label: 'Men View All', title: 'MEN COLLECTION' },
  { value: 'men-tops-shirts', label: 'Men Tops & Shirts', title: 'MEN TOPS & SHIRTS' },
  { value: 'men-bottomwear', label: 'Men Bottomwear', title: 'MEN BOTTOMWEAR' },
  { value: 'men-outerwears', label: 'Men Outerwears', title: 'MEN OUTERWEARS & JACKETS' },
  { value: 'accessories-view-all', label: 'Accessories View All', title: 'ACCESSORIES COLLECTION' },
  { value: 'accessories-bags', label: 'Accessories Bags', title: 'ACCESSORIES BAGS' },
  { value: 'accessories-boxers', label: 'Accessories Boxers', title: 'ACCESSORIES BOXERS' },
  { value: 'accessories-hats', label: 'Accessories Hats', title: 'ACCESSORIES HATS' },
  { value: 'accessories-charms-stuff', label: 'Charms & Stuff', title: 'CHARMS & STUFF' }
].map((item) => ({
  eyebrow: 'DISTRESSED',
  subtitle: 'Discover selected pieces from the Distressed collection.',
  ...item
}))

const collectionPages = [
  { value: 'collection-view-all', label: 'View All Collection', title: 'VIEW ALL COLLECTION', subtitle: 'Explore every piece across all Distressed collections.' },
  { value: 'women-collection', label: 'Women Collection', title: 'WOMEN COLLECTION', subtitle: 'Explore every Distressed collection created for women.' },
  { value: 'men-collection', label: 'Men Collection', title: 'MEN COLLECTION', subtitle: 'Explore every Distressed collection created for men.' }
].map((item) => ({
  group: 'collection',
  eyebrow: 'DISTRESSED',
  ...item
}))

const getSavedBanner = (banners, target) => {
  return banners.find((item) => item.page === target.value)
}

const BannerManagement = ({ token }) => {
  const navigate = useNavigate()
  const { pageId } = useParams()
  const [banners, setBanners] = useState([])
  const [filterType, setFilterType] = useState('page')
  const [target, setTarget] = useState(null)
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState('')
  const [eyebrow, setEyebrow] = useState('')
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const editing = Boolean(pageId)

  const fetchBannerData = async () => {
    try {
      const bannerResponse = await axios.get(backendUrl + '/api/banner/list')

      if (!bannerResponse.data.success) return toast.error(bannerResponse.data.message)

      setBanners(bannerResponse.data.banners)
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setDataLoaded(true)
    }
  }

  const loadBanner = useCallback((selectedTarget) => {
    const savedBanner = getSavedBanner(banners, selectedTarget)

    setTarget(selectedTarget)
    setImage(null)
    setPreview(savedBanner?.image || '')
    setEyebrow(savedBanner?.eyebrow || selectedTarget.eyebrow || '')
    setTitle(savedBanner?.title || selectedTarget.title || '')
    setSubtitle(savedBanner?.subtitle || selectedTarget.subtitle || '')
  }, [banners])

  const editBanner = (selectedTarget) => {
    navigate(`/admin/banner-management/${selectedTarget.value}`)
  }

  const selectImage = (event) => {
    const selectedImage = event.target.files[0]
    if (!selectedImage) return

    setImage(selectedImage)
    setPreview(URL.createObjectURL(selectedImage))
  }

  const saveBanner = async (event) => {
    event.preventDefault()
    const savedBanner = getSavedBanner(banners, target)
    if (!image && !savedBanner) return toast.error('Banner image is required')

    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('page', target.value)
      formData.append('eyebrow', eyebrow)
      formData.append('title', title)
      formData.append('subtitle', subtitle)
      if (image) formData.append('image', image)

      const response = await axios.post(backendUrl + '/api/banner/save', formData, { headers: { token } })
      if (response.data.success) {
        setBanners((prev) => [response.data.banner, ...prev.filter((item) => item.page !== target.value)])
        navigate('/admin/banner-management')
        toast.success(response.data.message)
      } else toast.error(response.data.message)
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const removeBanner = async (event) => {
    event.preventDefault()
    event.stopPropagation()

    try {
      const response = await axios.post(backendUrl + '/api/banner/remove', { page: target.value }, { headers: { token } })
      if (response.data.success) {
        setBanners((prev) => prev.filter((item) => item.page !== target.value))
        setImage(null)
        setPreview('')
        toast.success(response.data.message)
      } else toast.error(response.data.message)
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  useEffect(() => {
    fetchBannerData()
  }, [])

  useEffect(() => {
    if (!editing || !dataLoaded) return

    const selectedTarget = [...bannerPages, ...collectionPages].find((item) => item.value === pageId)

    if (!selectedTarget) {
      navigate('/admin/banner-management', { replace: true })
      return
    }

    loadBanner(selectedTarget)
  }, [pageId, editing, dataLoaded, navigate, loadBanner])

  const selectedTargets = filterType === 'collection' ? collectionPages : bannerPages
  const savedBanner = target ? getSavedBanner(banners, target) : null

  return (
    <div className='banner-page'>
      <div className='banner-header'>
        <h1>Banner Management</h1>
        <p>{editing ? `Editing ${target?.label || 'banner'}` : 'Review and manage page and collection banners in one place.'}</p>
      </div>

      {!editing ? (
        <>
          <div className='banner-filter'>
            <button type='button' onClick={() => setFilterType('page')} className={filterType === 'page' ? 'active' : ''}>Page</button>
            <button type='button' onClick={() => setFilterType('collection')} className={filterType === 'collection' ? 'active' : ''}>Collection Page</button>
          </div>

          <div className='banner-list'>
            {selectedTargets.map((item) => {
              const banner = getSavedBanner(banners, item)

              return (
                <div key={item.value} className='banner-list-card'>
                  <button type='button' onClick={() => editBanner(item)} className='banner-list-image'>
                    <img src={banner?.image || assets.dashboard_img} alt={item.label} />
                  </button>

                  <div className='banner-list-info'>
                    <div>
                      <p>{item.label}</p>
                      <small>{banner?.title || item.title}</small>
                    </div>
                    <button type='button' onClick={() => editBanner(item)}><FiEdit2 /> Edit</button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      ) : target && (
        <>
          <div className='banner-edit-nav'>
            <button type='button' onClick={() => navigate('/admin/banner-management')} className='banner-back-btn'><FiArrowLeft /> Back to all banners</button>
          </div>

          <form onSubmit={saveBanner} className='banner-form'>
            <div className='banner-card banner-preview-card'>
              <div className='banner-card-head'>
                <div>
                  <h2>Banner Preview</h2>
                  <p>Click the banner to replace it. Recommended ratio 5:2.</p>
                </div>
              </div>

              <div className='banner-upload-wrap'>
                <label htmlFor='banner-image' className='banner-upload'>
                  {preview ? <img src={preview} alt='Banner preview' /> : <div><FiImage /><span>Choose banner image</span></div>}
                  <input id='banner-image' type='file' accept='image/*' onChange={selectImage} hidden />
                </label>
                {savedBanner && <button type='button' onClick={removeBanner} className='banner-image-remove'><FiX /></button>}
              </div>
            </div>

            <div className='banner-card banner-fields-card'>
              <div className='banner-card-head'>
                <div>
                  <h2>Banner Content</h2>
                  <p>Edit the content displayed on this page.</p>
                </div>
              </div>

              <div className='banner-fields'>
                <label><span>Eyebrow</span><input value={eyebrow} onChange={(event) => setEyebrow(event.target.value)} type='text' placeholder='DISTRESSED' /></label>
                <label><span>Title</span><input value={title} onChange={(event) => setTitle(event.target.value)} type='text' placeholder='Banner title' required /></label>
                <label><span>Subtitle</span><textarea value={subtitle} onChange={(event) => setSubtitle(event.target.value)} placeholder='Banner description'></textarea></label>
              </div>

              <div className='banner-actions'>
                <button type='submit' disabled={loading} className='banner-save-btn'><FiSave /> {loading ? 'Saving...' : 'Save Banner'}</button>
              </div>
            </div>
          </form>

          <div className='banner-edit-switcher'>
            <div className='banner-edit-switcher-head'>
              <div><h2>Switch Banner</h2><p>Choose another page banner to continue editing.</p></div>
              <span>{target.group === 'collection' ? collectionPages.length : bannerPages.length} banners</span>
            </div>

            <div className='banner-edit-pages'>
              {(target.group === 'collection' ? collectionPages : bannerPages).map((item) => (
                <button key={item.value} type='button' onClick={() => editBanner(item)} className={target.value === item.value ? 'active' : ''}><span>{item.label}</span></button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default BannerManagement
