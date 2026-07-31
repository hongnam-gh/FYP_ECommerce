import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { emptyAdvancedFilters, normalizeSubCategory } from '../constants/productFilterConfig'
import { backendUrl } from '../constants/shopConfig'
import './AdvancedFilterSlide.css'

const colorSwatches = {
  black: '#111111',
  blue: '#4f9bd3',
  brown: '#74533d',
  cream: '#f1ead0',
  green: '#2e9d32',
  grey: '#8b8b8b',
  gray: '#8b8b8b',
  orange: '#e97828',
  pink: '#e9a8bd',
  purple: '#ae6bd0',
  red: '#e60000',
  white: '#ffffff',
  yellow: '#f2cf45'
}

const accessorySubCategories = ['Hats', 'Bags', 'Boxers', 'Charms & Stuff']

const getUniqueSizes = (products) => {
  const sizeOrder = ['S', 'M', 'L', 'XL', 'Free Size']
  const sizes = [...new Set(products.flatMap((item) => item.sizes || []))]

  return sizes.sort((a, b) => {
    const firstIndex = sizeOrder.indexOf(a)
    const secondIndex = sizeOrder.indexOf(b)

    if (firstIndex === -1 && secondIndex === -1) return a.localeCompare(b)
    if (firstIndex === -1) return 1
    if (secondIndex === -1) return -1

    return firstIndex - secondIndex
  })
}

const getSubCategories = (products, availableSubCategories, scope) => {
  if (scope === 'Accessories') return availableSubCategories.filter((item) => accessorySubCategories.includes(item))
  if (scope === 'Men' || scope === 'Women') return availableSubCategories.filter((item) => !accessorySubCategories.includes(item))

  const productSubCategories = [...new Set(products.map((item) => normalizeSubCategory(item.subCategory)).filter(Boolean))]
  return productSubCategories.length > 0 ? productSubCategories.sort((a, b) => a.localeCompare(b)) : availableSubCategories
}

const AdvancedFilterSlide = ({ open, onClose, products, filters, onApply, showSubCategory = false, subCategoryScope = '' }) => {
  const [draftFilters, setDraftFilters] = useState(filters)
  const [materials, setMaterials] = useState([])
  const [colors, setColors] = useState([])
  const [availableSubCategories, setAvailableSubCategories] = useState([])
  const sizes = useMemo(() => getUniqueSizes(products), [products])
  const subCategories = useMemo(() => getSubCategories(products, availableSubCategories, subCategoryScope), [products, availableSubCategories, subCategoryScope])

  useEffect(() => {
    const fetchProductOptions = async () => {
      try {
        const [materialResponse, colorResponse] = await Promise.all([
          axios.get(backendUrl + '/api/material/list'),
          axios.get(backendUrl + '/api/color/list')
        ])

        if (materialResponse.data.success) setMaterials(materialResponse.data.materials.map((item) => item.name))
        if (colorResponse.data.success) setColors(colorResponse.data.colors.map((item) => item.name))
      } catch (error) {
        console.log(error)
      }
    }

    fetchProductOptions()
  }, [])

  useEffect(() => {
    if (!showSubCategory) return

    const fetchSubCategories = async () => {
      try {
        const response = await axios.get(backendUrl + '/api/sub-category/list')
        if (response.data.success) setAvailableSubCategories(response.data.subCategories.map((item) => item.name))
      } catch (error) {
        console.log(error)
      }
    }

    fetchSubCategories()
  }, [showSubCategory])

  useEffect(() => {
    if (!open) return

    setDraftFilters(filters)
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = oldOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [open, filters, onClose])

  const toggleFilter = (field, value) => {
    setDraftFilters((prev) => ({
      ...prev,
      [field]: prev[field].includes(value) ? prev[field].filter((item) => item !== value) : [...prev[field], value]
    }))
  }

  const clearFilters = () => {
    setDraftFilters(emptyAdvancedFilters)
  }

  const applyFilters = () => {
    onApply(draftFilters)
    onClose()
  }

  return (
    <div className={`advanced-filter-overlay ${open ? 'open' : ''}`} onClick={onClose}>
      <aside className='advanced-filter-slide' onClick={(event) => event.stopPropagation()}>
        <div className='advanced-filter-header'>
          <h2>Advanced Filter</h2>
          <button type='button' className='advanced-filter-close' onClick={onClose} aria-label='Close advanced filter'><span></span><span></span></button>
        </div>

        <div className='advanced-filter-content'>
          <section className='advanced-filter-section'>
            <h3>Availability</h3>
            <div className='advanced-filter-options advanced-filter-options-two'>
              <button type='button' onClick={() => toggleFilter('availability', 'in-stock')} className={draftFilters.availability.includes('in-stock') ? 'active' : ''}>In Stock</button>
              <button type='button' onClick={() => toggleFilter('availability', 'out-of-stock')} className={draftFilters.availability.includes('out-of-stock') ? 'active' : ''}>Out of Stock</button>
            </div>
          </section>

          {showSubCategory && subCategories.length > 0 && (
            <section className='advanced-filter-section'>
              <h3>Subcategory</h3>
              <div className='advanced-filter-options advanced-filter-options-two'>
                {subCategories.map((item) => <button key={item} type='button' onClick={() => toggleFilter('subCategories', item)} className={draftFilters.subCategories.includes(item) ? 'active' : ''}>{item}</button>)}
              </div>
            </section>
          )}

          {materials.length > 0 && (
            <section className='advanced-filter-section'>
              <h3>Material</h3>
              <div className='advanced-filter-options advanced-filter-options-two'>
                {materials.map((item) => <button key={item} type='button' onClick={() => toggleFilter('materials', item)} className={draftFilters.materials.includes(item) ? 'active' : ''}>{item}</button>)}
              </div>
            </section>
          )}

          {colors.length > 0 && (
            <section className='advanced-filter-section'>
              <h3>Color</h3>
              <div className='advanced-filter-options advanced-filter-options-two'>
                {colors.map((item) => (
                  <button key={item} type='button' onClick={() => toggleFilter('colors', item)} className={`advanced-filter-color ${draftFilters.colors.includes(item) ? 'active' : ''}`}>
                    <span style={{ background: colorSwatches[item.toLowerCase()] || '#d1d5db' }}></span>{item}
                  </button>
                ))}
              </div>
            </section>
          )}

          {sizes.length > 0 && (
            <section className='advanced-filter-section'>
              <h3>Size</h3>
              <div className='advanced-filter-options advanced-filter-sizes'>
                {sizes.map((item) => <button key={item} type='button' onClick={() => toggleFilter('sizes', item)} className={draftFilters.sizes.includes(item) ? 'active' : ''}>{item}</button>)}
              </div>
            </section>
          )}
        </div>

        <div className='advanced-filter-actions'>
          <button type='button' onClick={clearFilters}>Clear</button>
          <button type='button' className='advanced-filter-apply' onClick={applyFilters}>Apply</button>
        </div>
      </aside>
    </div>
  )
}

export default AdvancedFilterSlide
