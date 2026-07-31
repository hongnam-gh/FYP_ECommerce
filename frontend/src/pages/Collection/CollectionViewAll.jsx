import React, { useEffect, useState } from 'react'
import axios from 'axios'
import useBanner from '../../hooks/useBanner'
import { backendUrl } from '../../constants/shopConfig'
import './CollectionViewAll.css'

const defaultCollections = [
  { name: 'View All', path: '/collection/view-all' },
  { name: 'Outerwears & Jackets', path: '/collection/view-all' },
  { name: 'Tops & Shirts', path: '/collection/view-all' },
  { name: 'Bottomwear', path: '/collection/view-all' }
]

const CollectionViewAll = ({ gender = '', title = 'VIEW ALL COLLECTION', subtitle = 'Explore every piece across all Distressed collections.' }) => {
  const banner = useBanner('collection-view-all')
  const [collections, setCollections] = useState(gender ? [] : defaultCollections)

  const getCollectionPath = (collection) => {
    if (!gender) return collection.path

    const collectionRoute = collection.path.replace(/^\/collection\//i, '')
    return `/${gender.toLowerCase()}-collection/${collectionRoute}`
  }

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await axios.get(backendUrl + '/api/collection/list')
        if (response.data.success) setCollections(gender ? response.data.collections.filter((item) => item.gender === gender) : response.data.collections)
      } catch (error) {
        console.log(error)
      }
    }

    fetchCollections()
  }, [gender])

  return (
    <main className='collection-view-all'>
      <section className='collection-view-all-hero' style={banner?.image ? { backgroundImage: `linear-gradient(rgba(0, 0, 0, .58), rgba(0, 0, 0, .58)), url(${banner.image})` } : undefined}>
        <p>{banner?.eyebrow || 'Distressed'}</p>
        <h1>{banner?.title || title}</h1>
        {(!banner || banner.subtitle) && <span>{banner?.subtitle || subtitle}</span>}
      </section>

      <div className='collection-view-all-content'>
        <section className='collection-view-all-section'>
          <div className='collection-view-all-title'>
            <span></span>
            <h2>Collections</h2>
            <span></span>
          </div>

          <div className='collection-view-all-grid'>
            {collections.map((card) => (
              <button key={card._id || card.name} type='button' onClick={() => window.location.href = getCollectionPath(card)} className='collection-view-all-card'>
                {card.image && <img src={card.image} alt={card.name} />}
                {card.image && <span className='collection-view-all-card-overlay'></span>}
                <span className='collection-view-all-card-content'>
                  <small>Distressed Collection</small>
                  <strong>{card.name}</strong>
                  <em>Explore Collection <b>→</b></em>
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

export default CollectionViewAll
