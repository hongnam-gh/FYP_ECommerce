import React, { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { assets } from '../../assets/assets'
import RelatedProducts from '../../components/RelatedProducts'
import { FiHeart } from 'react-icons/fi'
import { TbRulerMeasure } from 'react-icons/tb'
import axios from 'axios'
import { toast } from 'react-toastify'
import useAuth from '../../hooks/useAuth'
import useCart from '../../hooks/useCart'
import useProducts from '../../hooks/useProducts'
import useWishlist from '../../hooks/useWishlist'
import { backendUrl, currency } from '../../constants/shopConfig'
import './Product.css'
import { io } from 'socket.io-client'

const FIT_OPTIONS = [
  { value: 'slim', label: 'Slim Fit', description: 'A closer shape that follows the body and feels sharper.' },
  { value: 'regular', label: 'Regular Fit', description: 'A balanced shape with comfortable room for everyday wear.' },
  { value: 'oversized', label: 'Oversized Fit', description: 'A relaxed shape with extra room and a softer streetwear feel.' }
]

const SIZE_ORDER = ['S', 'M', 'L', 'XL']

const SIZE_CHART = {
  Women: [
    { size: 'S', minHeight: 150, maxHeight: 160, minWeight: 40, maxWeight: 48 },
    { size: 'M', minHeight: 155, maxHeight: 165, minWeight: 48, maxWeight: 56 },
    { size: 'L', minHeight: 160, maxHeight: 175, minWeight: 56, maxWeight: 66 },
    { size: 'XL', minHeight: 176, maxHeight: 188, minWeight: 67, maxWeight: 75 }
  ],
  Men: [
    { size: 'S', minHeight: 160, maxHeight: 170, minWeight: 50, maxWeight: 60 },
    { size: 'M', minHeight: 165, maxHeight: 174, minWeight: 60, maxWeight: 69 },
    { size: 'L', minHeight: 175, maxHeight: 180, minWeight: 70, maxWeight: 80 },
    { size: 'XL', minHeight: 181, maxHeight: 188, minWeight: 81, maxWeight: 92 }
  ]
}

const getSizeByValue = (chart, value, type) => {
  const minKey = type === 'height' ? 'minHeight' : 'minWeight'
  const maxKey = type === 'height' ? 'maxHeight' : 'maxWeight'
  const matchedSize = chart.find((item) => value >= item[minKey] && value <= item[maxKey])

  if (matchedSize) return matchedSize.size
  if (value < chart[0][minKey]) return chart[0].size

  return chart[chart.length - 1].size
}

const getSizeIndex = (size) => {
  const sizeIndex = SIZE_ORDER.indexOf(size)

  return sizeIndex >= 0 ? sizeIndex : 1
}

const getBodyType = (heightIndex, weightIndex) => {
  if (weightIndex > heightIndex) return 'short-heavy'
  if (heightIndex > weightIndex) return 'tall-slim'

  return 'balanced'
}

const getBaseSizeIndex = (heightIndex, weightIndex) => {
  if (weightIndex > heightIndex) return weightIndex
  if (heightIndex - weightIndex >= 2) return heightIndex - 1

  return Math.max(heightIndex, weightIndex)
}

const applyFitSize = (baseIndex, bodyType, fit) => {
  if (fit === 'slim') {
    if (bodyType === 'short-heavy') return baseIndex

    return Math.max(0, baseIndex - 1)
  }

  if (fit === 'oversized') {
    return Math.min(SIZE_ORDER.length - 1, baseIndex + 1)
  }

  return baseIndex
}

const getFitLabel = (fit) => {
  return FIT_OPTIONS.find((item) => item.value === fit)?.label || 'Regular Fit'
}

const getAvailableSize = (suggestedIndex, availableSizes) => {
  if (availableSizes.length === 1 && availableSizes[0] === 'Free Size') return 'Free Size'

  const suggestedSize = SIZE_ORDER[suggestedIndex]

  if (availableSizes.includes(suggestedSize)) return suggestedSize

  const matchedSizes = SIZE_ORDER
    .map((item, index) => ({ size: item, index }))
    .filter((item) => availableSizes.includes(item.size))
    .sort((a, b) => Math.abs(a.index - suggestedIndex) - Math.abs(b.index - suggestedIndex))

  return matchedSizes[0]?.size || suggestedSize
}

const getSizeSuggestion = ({ category, height, weight, fit, availableSizes }) => {
  const chart = SIZE_CHART[category] || SIZE_CHART.Men
  const heightSize = getSizeByValue(chart, height, 'height')
  const weightSize = getSizeByValue(chart, weight, 'weight')
  const heightIndex = getSizeIndex(heightSize)
  const weightIndex = getSizeIndex(weightSize)
  const bodyType = getBodyType(heightIndex, weightIndex)
  const baseIndex = getBaseSizeIndex(heightIndex, weightIndex)
  const suggestedIndex = applyFitSize(baseIndex, bodyType, fit)

  return {
    size: getAvailableSize(suggestedIndex, availableSizes),
    baseSize: SIZE_ORDER[baseIndex],
    fitLabel: getFitLabel(fit)
  }
}

const Product = () => {
  const { productId } = useParams()
  const { token } = useAuth()
  const { products } = useProducts()
  const { addToCart } = useCart()
  const { toggleWishlist, isWishlistItem } = useWishlist()
  const [productData, setProductData] = useState(false)
  const [image, setImage] = useState('')
  const [size, setSize] = useState('M')
  const [stock, setStock] = useState({})
  const [showSizeAvailable, setShowSizeAvailable] = useState(false)
  const [showSizeChartModal, setShowSizeChartModal] = useState(false)
  const [sizeChartUnit, setSizeChartUnit] = useState('cm')
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [bodyScale, setBodyScale] = useState({ height: 170, weight: 55 })
  const [pendingFit, setPendingFit] = useState('')
  const [confirmedFit, setConfirmedFit] = useState('')
  const bodyScaleRef = useRef(null)

  const fetchProductData = async () => {
    products.map((item) => {
      if (item._id == productId) { setProductData(item); setImage(item.image[0]); setSize(item.sizes?.[0] || 'M'); setActiveImageIndex(0); return null }
    })
  }

  const fetchProductStock = async () => {
    try {
      const response = await axios.post(backendUrl + '/api/inventory/single-public', { productId })

      if (response.data.success) setStock(response.data.inventory?.stock || {})
      else setStock({})
    } catch (error) {
      console.log(error)
      setStock({})
    }
  }

  const getSizeStock = (item) => {
    return Number(stock?.[item] || 0)
  }

  const selectedSizeStock = getSizeStock(size)
  const isSelectedSizeOut = selectedSizeStock <= 0
  const wished = productData ? isWishlistItem(productData._id) : false
  const cartButtonTheme = productData?.category === 'Men' ? 'men' : 'women'
  const showSizeChart = productData?.category !== 'Accessories'
  const showBodyScale = productData && (productData.category === 'Men' || productData.category === 'Women')
  const sizeChartImage = productData?.category === 'Women'
    ? (sizeChartUnit === 'cm' ? assets.women_cm : assets.women_inches)
    : (sizeChartUnit === 'cm' ? assets.men_cm : assets.men_inches)
  const minimumHeight = productData?.category === 'Women' ? 155 : 160
  const minimumWeight = productData?.category === 'Women' ? 45 : 60
  const maximumHeight = productData?.category === 'Women' ? 175 : 190
  const maximumWeight = productData?.category === 'Women' ? 75 : 90
  const minimumMeasurement = minimumHeight + 'cm / ' + minimumWeight + 'kg'
  const updateBodyScale = (event) => {
    const rect = bodyScaleRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = Math.min(Math.max(event.clientX - rect.left, 0), rect.width)
    const y = Math.min(Math.max(event.clientY - rect.top, 0), rect.height)

    const nextHeight = Math.round(minimumHeight + (x / rect.width) * (maximumHeight - minimumHeight))
    const nextWeight = Math.round(minimumWeight + (1 - y / rect.height) * (maximumWeight - minimumWeight))

    setBodyScale({
      height: nextHeight,
      weight: nextWeight
    })
  }

  const clampMeasurement = (field, value) => {
    const minValue = field === 'height' ? minimumHeight : minimumWeight
    const maxValue = field === 'height' ? maximumHeight : maximumWeight
    const numericValue = Number(value)

    if (value === '' || Number.isNaN(numericValue)) return minValue

    return Math.min(Math.max(Math.round(numericValue), minValue), maxValue)
  }

  const updateBodyScaleInput = (field, value) => {
    const digits = value.replace(/\D/g, '')

    if (digits === '') {
      setBodyScale((prev) => ({ ...prev, [field]: '' }))
      return
    }

    const numericValue = Number(digits)

    if (Number.isNaN(numericValue)) return

    setBodyScale((prev) => ({
      ...prev,
      [field]: numericValue
    }))
  }

  const normalizeBodyScaleInput = (field) => {
    setBodyScale((prev) => ({
      ...prev,
      [field]: clampMeasurement(field, prev[field])
    }))
  }

  const blockNonNumericInput = (event) => {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'Escape', 'ArrowLeft', 'ArrowRight', 'Home', 'End']

    if (allowedKeys.includes(event.key) || event.ctrlKey || event.metaKey) return
    if (/^\d$/.test(event.key)) return

    event.preventDefault()
  }

  const startBodyScaleDrag = (event) => {
    updateBodyScale(event)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const measuredHeight = clampMeasurement('height', bodyScale.height)
  const measuredWeight = clampMeasurement('weight', bodyScale.weight)
  const sizeSuggestion = getSizeSuggestion({
    category: productData?.category,
    height: measuredHeight,
    weight: measuredWeight,
    fit: confirmedFit || 'regular',
    availableSizes: productData?.sizes || []
  })
  const idealSize = sizeSuggestion.size

  const confirmFitHandler = () => {
    if (!pendingFit) return

    setConfirmedFit(pendingFit)
  }

  const selectedFitOption = FIT_OPTIONS.find((item) => item.value === pendingFit)

  const formatSubCategory = (subCategory) => {
    const subCategoryMap = {
      Topwear: 'Tops & Shirts',
      Bottomwear: 'Bottoms',
      'Bottom Wear': 'Bottoms',
      Winterwear: 'Outerwears & Jackets',
      TopsShirts: 'Tops & Shirts',
      'Tops & Shirts': 'Tops & Shirts',
      Outerwears: 'Outerwears & Jackets',
      'Outerwear & Jacket': 'Outerwears & Jackets',
      CharmsStuff: 'Charms & Stuff'
    }

    return subCategoryMap[subCategory] || subCategory
  }

  const getCategoryPath = (category) => {
    const categoryPathMap = {
      Women: '/women/view-all',
      Men: '/men/view-all',
      Accessories: '/accessories/view-all'
    }

    return categoryPathMap[category] || '/'
  }

  const getSubCategoryPath = (category, subCategory) => {
    const subCategoryPathMap = {
      Women: {
        Topwear: '/women/tops-shirts',
        Bottomwear: '/women/bottomwear',
        'Bottom Wear': '/women/bottomwear',
        Winterwear: '/women/outerwears',
        TopsShirts: '/women/tops-shirts',
        'Tops & Shirts': '/women/tops-shirts',
        Outerwears: '/women/outerwears',
        'Outerwear & Jacket': '/women/outerwears'
      },
      Men: {
        Topwear: '/men/tops-shirts',
        Bottomwear: '/men/bottomwear',
        'Bottom Wear': '/men/bottomwear',
        Winterwear: '/men/outerwears',
        TopsShirts: '/men/tops-shirts',
        'Tops & Shirts': '/men/tops-shirts',
        Outerwears: '/men/outerwears',
        'Outerwear & Jacket': '/men/outerwears'
      },
      Accessories: {
        Bags: '/accessories/bags',
        Boxers: '/accessories/boxers',
        Hats: '/accessories/hats',
        CharmsStuff: '/accessories/charms-stuff'
      }
    }

    return subCategoryPathMap[category]?.[subCategory] || getCategoryPath(category)
  }

  const getNewArrivalPath = (category) => {
    const newArrivalPathMap = {
      Women: '/new-arrivals/women',
      Men: '/new-arrivals/men',
      Accessories: '/new-arrivals/accessories'
    }

    return newArrivalPathMap[category] || '/'
  }

  const getProductBreadcrumb = () => {
    if (productData.newarrival) {
      return [
        { name: 'Home', path: '/' },
        { name: 'New Arrivals', path: getNewArrivalPath(productData.category) },
        { name: productData.category, path: getCategoryPath(productData.category) },
        { name: formatSubCategory(productData.subCategory), path: getSubCategoryPath(productData.category, productData.subCategory) },
        { name: productData.name, path: '' }
      ]
    }

    return [
      { name: 'Home', path: '/' },
      { name: productData.category, path: getCategoryPath(productData.category) },
      { name: formatSubCategory(productData.subCategory), path: getSubCategoryPath(productData.category, productData.subCategory) },
      { name: productData.name, path: '' }
    ]
  }

  const buyNowHandler = async () => {
    const added = await addToCart(productData._id, size, selectedSizeStock)
    if (!added) return

    if (!token) {
      localStorage.setItem('shouldMergeCart', 'true')
      window.location.href = '/login?redirect=/place-order'
      return
    }

    window.location.href = '/place-order'
  }

  const addCartHandler = async () => {
    const added = await addToCart(productData._id, size, selectedSizeStock)
    if (added) toast.success('Added To Cart')
  }

  useEffect(() => { fetchProductData() }, [productId, products])
  useEffect(() => { if (productId) fetchProductStock() }, [productId])

  useEffect(() => {
    if (!showBodyScale) return

    setBodyScale((prev) => ({
      height: clampMeasurement('height', prev.height),
      weight: clampMeasurement('weight', prev.weight)
    }))
  }, [showBodyScale, minimumHeight, minimumWeight, maximumHeight, maximumWeight])

  useEffect(() => {
    if (!productData || !productData.image || productData.image.length <= 1) return

    const imageInterval = setInterval(() => {
      setActiveImageIndex((prev) => {
        const nextIndex = (prev + 1) % productData.image.length
        setImage(productData.image[nextIndex])
        return nextIndex
      })
    }, 10000)

    return () => clearInterval(imageInterval)
  }, [productData])

  useEffect(() => {
    const socket = io(backendUrl, token ? { auth: { token } } : undefined)

    const updateProductStock = ({ inventory }) => {
      if (String(inventory.productId) !== String(productId)) return
      setStock(inventory.stock || {})
    }

    socket.on('inventory:update', updateProductStock)

    return () => {
      socket.off('inventory:update', updateProductStock)
      socket.disconnect()
    }
  }, [productId, token])

  return productData ? (
    <div className='product-page'>
      <div className='product-main'>
        <div className='product-gallery'>
          <div className='product-breadcrumb'>
            {getProductBreadcrumb().map((item, index, breadcrumbs) => (
              <React.Fragment key={item.name + item.path}>
                {index === breadcrumbs.length - 1 ? <span>{item.name}</span> : <Link to={item.path}>{item.name}</Link>}
                {index < breadcrumbs.length - 1 && <span>/</span>}
              </React.Fragment>
            ))}
          </div>

          <div className='product-thumbs'>
            {productData.image.map((item, index) => (
              <img key={index} onClick={() => { setImage(item); setActiveImageIndex(index) }} src={item} alt='' className={`product-thumb ${activeImageIndex === index ? 'product-thumb-active' : ''}`} />
            ))}
          </div>

          <div className='product-divider'></div>

          <div className='product-image-wrap'>
            <img key={activeImageIndex} className='product-image' src={image} alt='' />
          </div>
        </div>

        <div className='product-info'>
          <div className='product-title-row'>
            <h1 className='product-name'>{productData.name}</h1>
            <button type='button' onClick={() => toggleWishlist(productData._id)} className={`product-wishlist-btn ${wished ? 'active' : ''}`}><FiHeart /></button>
          </div>

          <div className='product-price-code-row'>
            <p className='product-price'>{currency}{productData.price}</p>
            <span className='product-price-code-divider'></span>
            <p className='product-code'>Code: {productData.code || '--'}</p>
          </div>

          <div className='product-size-block'>
            <div className='product-size-head'>
              <p className='product-size-title'>Select Size</p>

              <div onMouseEnter={() => setShowSizeAvailable(true)} onMouseLeave={() => setShowSizeAvailable(false)} className='product-size-available-wrap'>
                <button type='button' onClick={() => setShowSizeAvailable(!showSizeAvailable)} className='product-size-available-btn'>Size Available</button>

                {showSizeAvailable && (
                  <div className='product-size-available-box'>
                    <div className='product-size-available-top'>
                      <p>Available Size</p>
                      <span>Live stock check</span>
                    </div>

                    <div className='product-size-available-list'>
                      {productData.sizes.map((item, index) => (
                        <div key={index} className={`product-size-available-row ${getSizeStock(item) <= 0 ? 'product-size-available-empty' : ''}`}>
                          <span>{item}</span>
                          <b>{getSizeStock(item)}</b>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className='product-size-list'>
              {productData.sizes.map((item, index) => {
                const itemStock = getSizeStock(item)
                return (<button onClick={() => setSize(item)} key={index} disabled={itemStock <= 0} className={`product-size-btn ${item === size ? 'product-size-active' : ''} ${itemStock <= 0 ? 'product-size-disabled' : ''}`}>{item}</button>)
              })}
            </div>
          </div>

          <div className='product-action-row'>
            <div className='product-action-buttons'>
              <button disabled={isSelectedSizeOut} onClick={buyNowHandler} className={`product-buy-btn ${isSelectedSizeOut ? 'product-cart-btn-disabled' : ''}`}>{isSelectedSizeOut ? 'OUT OF STOCK' : 'BUY NOW'}</button>
              <button disabled={isSelectedSizeOut} onClick={addCartHandler} className={`product-cart-btn product-cart-btn-${cartButtonTheme} ${isSelectedSizeOut ? 'product-cart-btn-disabled' : ''}`}>{isSelectedSizeOut ? 'OUT OF STOCK' : 'ADD TO CART'}</button>
            </div>

            {showSizeChart && (
              <button type='button' onClick={() => setShowSizeChartModal(true)} className='product-size-chart-btn'>
                <TbRulerMeasure />
                <span>Size Chart</span>
              </button>
            )}
          </div>
          <hr className='product-hr' />

          {showBodyScale && (
            <div className='product-body-scale'>
              <div className='product-body-scale-head'>
                <p>Find Your Ideal Measurement</p>
                <span>Minimum measurement: {minimumMeasurement}</span>
              </div>

              <div className='product-scale-layout'>
                <div className='product-scale-wrap'>
                  <span className='product-scale-y-title'>kg</span>
                  <span className='product-scale-y-max'>{maximumWeight}</span>
                  <span className='product-scale-y-min'>Min</span>

                  <div ref={bodyScaleRef} onPointerDown={startBodyScaleDrag} onPointerMove={(event) => { if (event.buttons === 1) updateBodyScale(event) }} className='product-scale-board'>
                    <div style={{ left: `${((measuredHeight - minimumHeight) / (maximumHeight - minimumHeight)) * 100}%`, bottom: `${((measuredWeight - minimumWeight) / (maximumWeight - minimumWeight)) * 100}%` }} className={"product-scale-model product-scale-model-" + productData.category.toLowerCase()}>
                      <span className='product-scale-model-head'></span>
                      <span className='product-scale-model-body'></span>
                      <span className='product-scale-model-arm product-scale-model-arm-left'></span>
                      <span className='product-scale-model-arm product-scale-model-arm-right'></span>
                      <span className='product-scale-model-leg product-scale-model-leg-left'></span>
                      <span className='product-scale-model-leg product-scale-model-leg-right'></span>
                    </div>
                  </div>

                  <span className='product-scale-x-title'>cm</span>
                  <span className='product-scale-x-min'></span>
                  <span className='product-scale-x-max'>{maximumHeight}</span>
                </div>

                <div className='product-fit-result'>
                  {!confirmedFit ? (
                    <div className={`choose-your-size choose-your-size-${productData.category.toLowerCase()} product-fit-panel-fade`}>
                      <div className='choose-your-size-head'>
                        <span className='choose-your-size-label'>Choose Your Fit</span>
                        <div className='choose-your-size-measurement'>
                          <label>
                            <input
                              type='text'
                              inputMode='numeric'
                              pattern='[0-9]*'
                              min={minimumHeight}
                              max={maximumHeight}
                              value={bodyScale.height}
                              onKeyDown={blockNonNumericInput}
                              onChange={(event) => updateBodyScaleInput('height', event.target.value)}
                              onBlur={() => normalizeBodyScaleInput('height')}
                            />
                            <span>cm</span>
                          </label>
                          <label>
                            <input
                              type='text'
                              inputMode='numeric'
                              pattern='[0-9]*'
                              min={minimumWeight}
                              max={maximumWeight}
                              value={bodyScale.weight}
                              onKeyDown={blockNonNumericInput}
                              onChange={(event) => updateBodyScaleInput('weight', event.target.value)}
                              onBlur={() => normalizeBodyScaleInput('weight')}
                            />
                            <span>kg</span>
                          </label>
                        </div>
                      </div>

                      <div className='choose-your-size-content'>
                        <div className='product-fit-choice-list'>
                          {FIT_OPTIONS.map((item) => (
                            <button key={item.value} type='button' onClick={() => setPendingFit(item.value)} className={`product-fit-choice-btn ${pendingFit === item.value ? 'product-fit-choice-active' : ''}`}>{item.label}</button>
                          ))}
                        </div>

                        <div className='choose-your-size-desc'>
                          <span>{selectedFitOption ? selectedFitOption.label : 'Fit Detail'}</span>
                          <p>{selectedFitOption ? selectedFitOption.description : 'Select a fit style to preview how the size recommendation will be adjusted.'}</p>
                        </div>
                      </div>

                      <button type='button' onClick={confirmFitHandler} disabled={!pendingFit} className={`product-fit-confirm-btn ${!pendingFit ? 'product-fit-confirm-disabled' : ''}`}>Confirm Fit Style</button>
                    </div>
                  ) : (
                    <div className={`size-guide-card size-guide-card-${productData.category.toLowerCase()} product-fit-panel-fade`}>
                      <div className='size-guide-card-top'>
                        <span className='size-guide-card-label'>Recommended Size</span>
                        <button type='button' onClick={() => setConfirmedFit('')} className='product-fit-change-btn'>Change</button>
                      </div>
                      <div className='product-fit-size-row'>
                        <span>{sizeSuggestion.fitLabel}</span>
                        <strong>{idealSize}</strong>
                      </div>
                      <div className='product-fit-measures'>
                        <p><span>Height</span><b>{measuredHeight} cm</b></p>
                        <p><span>Weight</span><b>{measuredWeight} kg</b></p>
                        <p><span>Base size</span><b>Size {sizeSuggestion.baseSize}</b></p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showSizeChartModal && (
        <div onClick={() => setShowSizeChartModal(false)} className='product-size-chart-overlay'>
          <div onClick={(e) => e.stopPropagation()} className='product-size-chart-modal'>
            <div className='product-size-chart-head'>
              <button type='button' onClick={() => setShowSizeChartModal(false)} className='product-size-chart-close'>×</button>
            </div>

            <div className='product-size-chart-body'>
              <div className='product-size-chart-tabs'>
                <button type='button' onClick={() => setSizeChartUnit('cm')} className={`product-size-chart-tab ${sizeChartUnit === 'cm' ? 'product-size-chart-tab-active' : ''}`}>Centimeters</button>
                <button type='button' onClick={() => setSizeChartUnit('inch')} className={`product-size-chart-tab ${sizeChartUnit === 'inch' ? 'product-size-chart-tab-active' : ''}`}>Inches</button>
              </div>

              <div className='product-size-chart-image-wrap'>
                <img src={sizeChartImage} alt={`${productData.category} size chart`} decoding='async' className='product-size-chart-image' />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className='product-detail-box'>
        <div className='product-description-head'>
          <span>Product Information</span>
          <h2>Description</h2>
        </div>

        <div className='product-description'>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent eu tempor nulla. Suspendisse diam justo, dignissim eu erat in, eleifend luctus felis. Ut eget odio non sapien lobortis consectetur ac pharetra metus. Curabitur vel lectus sed nisi vehicula interdum non quis felis. Aenean eros massa, cursus sed nunc in, faucibus congue sapien. Nam auctor ac nisl in semper. Curabitur mollis ligula at urna mattis mollis.</p>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent eu tempor nulla. Suspendisse diam justo, dignissim eu erat in, eleifend luctus felis. Ut eget odio non sapien lobortis consectetur ac pharetra metus. Curabitur vel lectus sed nisi vehicula interdum non quis felis. Aenean eros massa, cursus sed nunc in, faucibus congue sapien. Nam auctor ac nisl in semper. Curabitur mollis ligula at urna mattis mollis.</p>
        </div>
      </div>

      <RelatedProducts productId={productData._id} category={productData.category} subCategory={productData.subCategory} />
    </div>
  ) : (<div className='product-empty'></div>)
}

export default Product
