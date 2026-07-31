import React from 'react'
import { Link } from 'react-router-dom'
import { assets } from '../../assets/assets'
import './DiscoverFashion.css'

const collections = [
  { title: 'SPRING 27', image: assets.spring27_poster, path: '/discover-fashion/spring-27' },
  { title: 'WINTER 26', image: assets.winter26_poster, path: '/discover-fashion/winter-26' },
  { title: 'FALL 26', image: assets.fall26_poster, path: '/discover-fashion/fall-26' },
  { title: 'SUMMER 26', image: assets.summer26_poster, path: '/discover-fashion/summer-26' },
  { title: 'SPRING 24', image: assets.spring24_poster, path: '/discover-fashion/spring-24' },
  { title: 'WINTER 25', image: assets.winter25_poster, path: '/discover-fashion/winter-25' },
  { title: 'SPRING 23', image: assets.spring23_poster, path: '/discover-fashion/spring-23' },
  { title: 'WINTER 23', image: assets.winter23_poster, path: '/discover-fashion/winter-23' }
]

const DiscoverFashion = () => {
  return (
    <main className='discover-fashion-page'>
      <div className='discover-fashion-title'>
        <h1>ALL COLLECTIONS</h1>
      </div>

      <div className='discover-fashion-grid'>
        {collections.map((item) => (
          <Link key={item.title} to={item.path} className='discover-fashion-card'>
            <img src={item.image} alt={item.title} />
          </Link>
        ))}
      </div>
    </main>
  )
}

export default DiscoverFashion
