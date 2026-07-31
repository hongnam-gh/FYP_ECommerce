import React, { useEffect, useRef, useState } from 'react'
import { assets } from '../assets/assets'
import PriceRangeFilter from './PriceRangeFilter'
import AdvancedFilterSlide from './AdvancedFilterSlide'
import { getProductsData } from '../hooks/useProducts'

const ProductFilterSidebar = ({ showFilter, setShowFilter, products, filterCategory, newArrivalOnly, setNewArrivalOnly = () => {}, newArrivalLocked = false, setPriceRange, sortType, setSortType, advancedFilters, setAdvancedFilters, showSubCategory = false, subCategoryScope = filterCategory }) => {
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false)
  const [fixedFilterStyle, setFixedFilterStyle] = useState(null)
  const [columnHeight, setColumnHeight] = useState(null)
  const columnRef = useRef(null)
  const filterRef = useRef(null)
  const filterProducts = filterCategory ? products.filter((item) => item.category === filterCategory) : products

  useEffect(() => {
    getProductsData(advancedFilters)
  }, [advancedFilters])

  useEffect(() => {
    return () => getProductsData()
  }, [])

  useEffect(() => {
    const updateFixedFilter = () => {
      const column = columnRef.current
      const filter = filterRef.current

      if (!column || !filter || window.innerWidth < 640) {
        setFixedFilterStyle(null)
        setColumnHeight(null)
        return
      }

      const topOffset = 105
      const columnRect = column.getBoundingClientRect()
      const pageRect = column.closest('.chung-page')?.getBoundingClientRect()
      const filterHeight = filter.offsetHeight
      const shouldFix = columnRect.top <= topOffset && (!pageRect || pageRect.bottom - filterHeight > topOffset)

      setColumnHeight(filterHeight)
      setFixedFilterStyle(shouldFix
        ? {
            position: 'fixed',
            top: `${topOffset}px`,
            left: `${columnRect.left}px`,
            width: `${columnRect.width}px`
          }
        : null
      )
    }

    updateFixedFilter()
    window.addEventListener('scroll', updateFixedFilter, { passive: true })
    window.addEventListener('resize', updateFixedFilter)

    return () => {
      window.removeEventListener('scroll', updateFixedFilter)
      window.removeEventListener('resize', updateFixedFilter)
    }
  }, [showFilter, products.length, advancedFilters, newArrivalOnly, sortType])

  return (
    <div ref={columnRef} className='chung-filter-column' style={columnHeight ? { minHeight: `${columnHeight}px` } : undefined}>
      <div ref={filterRef} className={`chung-filter ${fixedFilterStyle ? 'chung-filter-fixed' : ''}`} style={fixedFilterStyle || undefined}>
        <p onClick={() => setShowFilter(!showFilter)} className='chung-filter-title'>
          QUICK FILTERS
          <img className={`chung-filter-icon ${showFilter ? 'chung-filter-icon-active' : ''}`} src={assets.dropdown_icon} alt='' />
        </p>

        <div className={`chung-filter-controls ${showFilter ? 'chung-filter-controls-open' : ''}`}>
          <label className={`chung-new-arrival-filter ${newArrivalLocked ? 'locked' : ''}`}>
            <input type='checkbox' checked={newArrivalOnly} disabled={newArrivalLocked} onChange={(event) => setNewArrivalOnly(event.target.checked)} />
            <span></span>
            New Arrivals
          </label>

          <PriceRangeFilter products={filterProducts} onChange={setPriceRange} />

          <button type='button' onClick={() => setShowAdvancedFilter(true)} className='chung-advanced-filter'>Advanced Filter</button>

          <select value={sortType} onChange={(event) => setSortType(event.target.value)} className='chung-sort'>
            <option value='relavent'>Sort by: Relavent</option>
            <option value='low-high'>Sort by: Low to High</option>
            <option value='high-low'>Sort by: High to Low</option>
          </select>
        </div>
      </div>

      <AdvancedFilterSlide open={showAdvancedFilter} onClose={() => setShowAdvancedFilter(false)} products={filterProducts} filters={advancedFilters} onApply={setAdvancedFilters} showSubCategory={showSubCategory} subCategoryScope={subCategoryScope} />
    </div>
  )
}

export default ProductFilterSidebar
