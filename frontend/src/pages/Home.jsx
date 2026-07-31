import React from 'react'
import { Link } from 'react-router-dom'
import { assets } from '../assets/assets'
import './Home.css'

const Home = () => {
  return (
    <div>
      <video className='hero-main' src={assets.hero_video} autoPlay muted loop playsInline />

      <section className='home-collection'>
        <h2>DISCOVER DISTRESSED COLLECTION</h2>

        <div className='home-collection-grid'>
          <Link to='/Discover-Fashion' className='home-collection-box hero-left'>
            <img src={assets.hero_left} alt='Distressed collection' />
          </Link>
          <Link to='/Discover-Fashion' className='home-collection-box hero-middle'>
            <img src={assets.hero_middle} alt='Distressed collection' />
          </Link>
          <Link to='/Discover-Fashion' className='home-collection-box hero-right'>
            <img src={assets.hero_right} alt='Distressed collection' />
          </Link>
        </div>

      </section>

      <div className='hero-category-gallery'>
        <div className='hero-category-title'>
          <h2>SHOP BY CATEGORY</h2>
        </div>

        <div className='hero-category-grid'>
          <Link to='/new-arrivals/women' className='hero-category-box hero-category-one'>
            <img src={assets.hero_category_one} alt='New arrivals' />
            <h3>NEW ARRIVALS</h3>
          </Link>
          <Link to='/women/view-all' className='hero-category-box hero-category-two'>
            <img src={assets.hero_category_two} alt='Women wear' />
            <h3>WOMEN WEAR</h3>
          </Link>
          <Link to='/men/view-all' className='hero-category-box hero-category-three'>
            <img src={assets.hero_category_three} alt='Men wear' />
            <h3>MEN WEAR</h3>
          </Link>
          <Link to='/accessories/view-all' className='hero-category-box hero-category-four'>
            <img src={assets.hero_category_four} alt='Accessories' />
            <h3>ACCESSORIES</h3>
          </Link>
        </div>
      </div>

      <div className='right-feature'>
        <div className='right-feature-grid'>
          <div className='right-feature-video'>
            <iframe
              src='https://www.youtube.com/embed/4wQ885Kltsk'
              title='Distressed fashion video'
              allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
              allowFullScreen
            ></iframe>
          </div>

          <div className='right-feature-image'>
            <img src={assets.right} alt='Distressed' />
            <h2>DISTRESSED</h2>
          </div>
        </div>
      </div>

      <div className='balen-banner'>
        <img src={assets.balen} alt='Balen' />
      </div>

    </div>
  )
}

export default Home
