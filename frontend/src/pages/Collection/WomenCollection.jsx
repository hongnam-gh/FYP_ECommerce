import React, { useEffect, useState } from 'react'
import axios from 'axios'
import useBanner from '../../hooks/useBanner'
import { backendUrl } from '../../constants/shopConfig'
import './MenWomenCollection.css'

const WomenCollection = () => {
  const banner = useBanner('women-collection')
  const [collections, setCollections] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await axios.get(backendUrl + '/api/collection/list')
        if (response.data.success) setCollections(response.data.collections.filter((item) => item.gender === 'Women'))
      } catch (error) {
        console.log(error)
      } finally {
        setLoaded(true)
      }
    }

    fetchCollections()
  }, [])

  return (
    <main className='collection-view-all'>
      <section className='collection-view-all-hero' style={banner?.image ? { backgroundImage: `linear-gradient(rgba(0, 0, 0, .58), rgba(0, 0, 0, .58)), url(${banner.image})` } : undefined}>
        <p>{banner?.eyebrow || 'Distressed'}</p>
        <h1>{banner?.title || 'WOMEN COLLECTION'}</h1>
        {(!banner || banner.subtitle) && <span>{banner?.subtitle || 'Explore every Distressed collection created for women.'}</span>}
      </section>

      <div className='collection-view-all-content'>
        <section className='collection-view-all-section'>
          <div className='collection-view-all-title'>
            <span></span>
            <h2>Collections</h2>
            <span></span>
          </div>

          {loaded && <div className='collection-view-all-grid'>
            {collections.map((card) => {
              const collectionRoute = card.path.replace(/^\/collection\//i, '')

              return (
                <button key={card._id} type='button' onClick={() => window.location.href = `/women-collection/${collectionRoute}`} className='collection-view-all-card'>
                  {card.image && <img src={card.image} alt={card.name} />}
                  {card.image && <span className='collection-view-all-card-overlay'></span>}
                  <span className='collection-view-all-card-content'>
                    <small>Distressed Collection</small>
                    <strong>{card.name}</strong>
                    <em>Explore Collection <b>→</b></em>
                  </span>
                </button>
              )
            })}
          </div>}
        </section>
      </div>
    </main>
  )
}

export default WomenCollection
