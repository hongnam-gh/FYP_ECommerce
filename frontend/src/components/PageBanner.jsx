import React from 'react'
import { assets } from '../assets/assets'
import useBanner from '../hooks/useBanner'

const PageBanner = ({ page, title }) => {
  const banner = useBanner(page)

  return (
    <div className='chung-banner'>
      <img src={banner?.image || assets.dashboard_img} alt={title} />
      <div className='chung-banner-overlay'>
        <p>{banner?.eyebrow || 'DISTRESSED'}</p>
        <h1>{banner?.title || title}</h1>
        {(!banner || banner.subtitle) && <span>{banner?.subtitle || 'Discover selected pieces from the Distressed collection.'}</span>}
      </div>
    </div>
  )
}

export default PageBanner
