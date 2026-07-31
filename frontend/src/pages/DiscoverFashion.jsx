import React from 'react'
import { Link } from 'react-router-dom'
import { assets } from '../assets/assets'
import './DiscoverFashion.css'

const collections = [
  { title: 'SPRING 27', image: assets.hero_category_two, path: '/women/view-all' },
  { title: 'WINTER 26', image: assets.hero_category_three, path: '/men/view-all' },
  { title: 'FALL 26', image: assets.balen, path: '/collection/view-all' },
  { title: 'SUMMER 26', image: assets.hero_category_one, path: '/new-arrivals/women' },
  { title: 'NEW ARRIVALS', image: assets.new_arrival_search_bar, path: '/new-arrivals/women' },
  { title: 'WOMEN WEAR', image: assets.women_search_bar, path: '/women/view-all' },
  { title: 'MEN WEAR', image: assets.men_search_bar, path: '/men/view-all' },
  { title: 'ACCESSORIES', image: assets.accessories_search_bar, path: '/accessories/view-all' }
]

const DiscoverFashion = () => {
  return (
    <div className='discover-fashion-page'>
      <div className='discover-fashion-title'>
        <h1>DISTRESSED ALL COLLECTIONS</h1>
      </div>

      <div className='discover-fashion-grid'>
        {collections.map((item) => (
          <Link key={item.title} to={item.path} className='discover-fashion-card'>
            <img src={item.image} alt={item.title} />
            <h2>{item.title}</h2>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default DiscoverFashion
