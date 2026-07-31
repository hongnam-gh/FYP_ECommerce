import React from 'react'
import { assets } from '../../assets/assets'
import './DiscoverFashionPage.css'

const winterImages = [
  assets.winter1,
  assets.winter2,
  assets.winter3,
  assets.winter4,
  assets.winter5,
  assets.winter6,
  assets.winter7,
  assets.winter8,
  assets.winter9,
  assets.winter10,
  assets.winter11,
  assets.winter12
]

const description = [
  'To find the light. The Balenciaga Winter 26 Womens and Mens collection by Creative Director Pierpaolo Piccioli takes as its essence the High Renaissance artistic technique of clair-obscur—a search for the tension between darkness and light. A means of defining and describing volume, in these dual extremes we may discover new dimension.',
  'Light defined by its shadow, darkness always relieved with light. The collection finds an interplay in these inherent antinomies, the certitude and truth that one cannot exist without the other. Metaphorically, darkness and light are explored as defining elements of the human condition—creating portraits of people, evoked through cloth.',
  'A capturing of the ephemeral for eternality, bearing witness to a moment in time. Clair-obscur effects are frozen in embroideries on dresses and the Midnight City bag, ombré effects on the D’Orsay sneakers as if illuminated, imagined light cast. Spontaneous gestures of cloth pause against the body in free draperies. Shoes created with J.M. Weston for women and men twist and fold around the form of the foot, manipulated and altered. The HG Avenue bag bears a sense of the passage of time, the sculptural life of natural movement caught. Embellishments and fabrics can act as painting—here, you can see the light.',
  'The within. Expanding the methodologies of Cristóbal Balenciaga, the centrality of and focus on the human form, the body itself becomes the structure inside garments. Collars, hoods, décolletages frame the face like a portrait; cuts reveal the skin; shoes move from the foot, an air between, magically suspended. Reinterpretations of light, as both the visible and the physical. A new Balenciaga emblem, on the new George Bag, its form defined by space within. A weightlessness given to the architecture of clothes, cocoon shapes suspended. Throughout, a rapport and conversation, between fabric and the individual. Light draws out form, color, shape, redefining. Materialities are curated for their inherent natural abilities to absorb and reflect—supple leather, dense cashmere, silk, sequin embroideries. Their lusters can alter our perceptions, shift attitudes on clothes.',
  'New shapes and volumes are translated to a scope of modern garments. Fashion as reflection on the contemporaneous - a wardrobe of here and today, of people. Dialogue on colors—resonant of emotion, expressing feeling. The spectrum has a phosphorescent intensity, hues afforded a strength and power, a radiance, to emerge from shadow.',
  'Different generations walk together, in clothes created to symbiotically fuse them as a collective power yet celebrate them as individual forces, unity in being. Alive, collective, here, they form a fresco of humanity.'
]

const DiscoverFashionPage = () => {
  return (
    <main className='discover-detail-page'>
      <section className='discover-detail-video'>
        <video src={assets.winter26_video} autoPlay muted loop playsInline controls />
      </section>

      <section className='discover-detail-grid'>
        {winterImages.map((image, index) => (
          <img key={index} src={image} alt={`Winter 26 look ${index + 1}`} />
        ))}
      </section>

      <section className='discover-detail-description'>
        {description.map((text, index) => (
          <p key={index}>{text}</p>
        ))}
      </section>
    </main>
  )
}

export default DiscoverFashionPage
