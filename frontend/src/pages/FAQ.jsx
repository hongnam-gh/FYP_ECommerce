import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiChevronDown } from 'react-icons/fi'
import { assets } from '../assets/assets'
import './FAQ.css'

const faqData = {
  'Orders & Payment': [
    {
      question: 'How do I know if my order was placed successfully?',
      answer: 'After checkout, your order will appear in My Orders with its current approval and payment status.'
    },
    {
      question: 'Which payment methods can I use?',
      answer: 'You can choose one of the payment methods available at checkout. The available options may depend on your order.'
    },
    {
      question: 'Can I cancel my order?',
      answer: 'You can cancel an eligible order from My Orders before it moves too far into the delivery process.'
    },
    {
      question: 'Why is my payment status still pending?',
      answer: 'A payment can remain pending while it is being confirmed. Refresh My Orders later or contact Customer Service if the status does not change.'
    }
  ],
  'Shipping & Delivery': [
    {
      question: 'How can I track my order?',
      answer: 'Open My Orders and select the order you want to follow. Its latest delivery status will be shown there.'
    },
    {
      question: 'Can I change my delivery address?',
      answer: 'Contact Customer Service as soon as possible. An address cannot be changed after the order has entered delivery.'
    },
    {
      question: 'Why is my delivery delayed?',
      answer: 'Delivery may take longer during busy periods or because of carrier conditions. Check your order status for the latest update.'
    },
    {
      question: 'What happens if I miss my delivery?',
      answer: 'The carrier may attempt another delivery or contact you using the phone number provided with your order.'
    }
  ],
  'Exchanges & Returns': [
    {
      question: 'How do I request a return?',
      answer: 'Contact Customer Service with your order ID and the item you want to return. The team will guide you through the next steps.'
    },
    {
      question: 'Can I exchange an item for another size?',
      answer: 'A size exchange depends on current stock. Contact Customer Service before sending the item back.'
    },
    {
      question: 'When will I receive my refund?',
      answer: 'Refund processing begins after the returned item has been received and checked.'
    },
    {
      question: 'Can every product be returned?',
      answer: 'Return eligibility depends on the item condition and the return policy applied to your order.'
    }
  ],
  'My Account': [
    {
      question: 'How do I update my account information?',
      answer: 'Open your account panel and go to your profile to review or update the available information.'
    },
    {
      question: 'What should I do if I forgot my password?',
      answer: 'Select Forgot Password on the login page and follow the instructions sent to your email.'
    },
    {
      question: 'Where can I see my membership rank?',
      answer: 'Your current membership rank is displayed in the account panel together with your order and spending information.'
    },
    {
      question: 'How do I view my saved products?',
      answer: 'Open Wishlist from your account panel or the navigation menu to see all products you have saved.'
    }
  ],
  Products: [
    {
      question: 'How do I choose the right size?',
      answer: 'Use the size information on the product page and compare it with your measurements before adding the item to your cart.'
    },
    {
      question: 'How can I check if a product is in stock?',
      answer: 'Available sizes are shown on the product page. Products with no remaining quantity are marked Out of Stock.'
    },
    {
      question: 'Where can I find product material and color information?',
      answer: 'Material and color options are displayed with the product information when they are available.'
    },
    {
      question: 'Will an out-of-stock product return?',
      answer: 'Stock may be updated, but a restock is not guaranteed. Check the product page again for the latest availability.'
    }
  ]
}

const FAQ = () => {
  const navigate = useNavigate()
  const categories = Object.keys(faqData)
  const [category, setCategory] = useState(categories[0])
  const [openQuestion, setOpenQuestion] = useState(null)

  const changeCategory = (event) => {
    setCategory(event.target.value)
    setOpenQuestion(null)
  }

  const toggleQuestion = (index) => {
    setOpenQuestion(openQuestion === index ? null : index)
  }

  return (
    <div style={{ backgroundImage: `url(${assets.faq_theme})` }} className='faq-page'>
      <div className='faq-card'>
        <div className='faq-tabs'>
          <button type='button' className='active'>FAQ</button>
          <button type='button' onClick={() => navigate('/purchase-guidance')}>Purchase Guidance</button>
        </div>

        <section className='faq-header'>
          <p>Distressed Assistance</p>
          <h1>Frequently Asked Questions</h1>
          <span>Select a category below to find answers to the most common questions.</span>
        </section>

        <section className='faq-content'>
          <label htmlFor='faq-category'>Category</label>
          <div className='faq-select'>
            <select id='faq-category' value={category} onChange={changeCategory}>
              {categories.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
            <FiChevronDown />
          </div>

          <div className='faq-list'>
            {faqData[category].map((item, index) => (
              <div key={item.question} className={`faq-item ${openQuestion === index ? 'open' : ''}`}>
                <button type='button' onClick={() => toggleQuestion(index)}>
                  <span>{item.question}</span>
                  <FiChevronDown />
                </button>
                {openQuestion === index && <p>{item.answer}</p>}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export default FAQ
