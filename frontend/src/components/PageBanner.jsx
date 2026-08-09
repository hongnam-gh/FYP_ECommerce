import React from 'react'
import useBanner from '../hooks/useBanner'

const PageBanner = ({ page, title }) => {
  const banner = useBanner(page)

  return (
    <div className={`chung-banner ${!banner?.image ? 'chung-banner-empty' : ''}`}>
      {banner?.image && <img src={banner.image} alt={title} />}
      <div className='chung-banner-overlay'>
        <p>{banner?.eyebrow || 'DISTRESSED'}</p>
        <h1>{banner?.title || title}</h1>
        {(!banner || banner.subtitle) && <span>{banner?.subtitle || 'Discover selected pieces from the Distressed collection.'}</span>}
      </div>
    </div>
  )
}

export default PageBanner
