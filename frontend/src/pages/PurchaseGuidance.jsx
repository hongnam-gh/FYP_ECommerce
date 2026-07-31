import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { assets } from '../assets/assets'
import './PurchaseGuidance.css'

const purchaseSteps = [
  {
    image: assets.purchase_step_one,
    title: 'Select Your Product',
    description: 'Choose the product you would like to purchase, select the appropriate options, and proceed by clicking Buy Now or Add to Cart.'
  },
  {
    image: assets.purchase_step_two,
    title: 'Review Your Cart',
    description: 'Select the Cart icon in the top navigation bar to review your items, then click Proceed to Payment to begin the checkout process.'
  },
  {
    image: assets.purchase_step_three,
    title: 'Complete Your Information',
    description: 'Enter the required delivery and contact information, then select the payment method that best suits your preference.'
  },
  {
    image: assets.purchase_step_four,
    title: 'Await Order Approval',
    description: 'After placing your order, it will remain in Pending status while awaiting administrative approval. This review may take up to 15 minutes.'
  },
  {
    image: assets.purchase_step_five,
    title: 'Receive Your Order',
    description: 'Once your order has been approved, you will receive a notification. No further action is required—simply wait for your order to be delivered.'
  }
]

const PurchaseGuidance = () => {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)

  const previousStep = () => {
    setCurrentStep(currentStep === 0 ? purchaseSteps.length - 1 : currentStep - 1)
  }

  const nextStep = () => {
    setCurrentStep(currentStep === purchaseSteps.length - 1 ? 0 : currentStep + 1)
  }

  const step = purchaseSteps[currentStep]

  return (
    <div style={{ backgroundImage: `url(${assets.faq_theme})` }} className='purchase-guidance-page'>
      <div className='purchase-guidance-card'>
        <div className='purchase-guidance-tabs'>
          <button type='button' onClick={() => navigate('/faq')}>FAQ</button>
          <button type='button' className='active'>Purchase Guidance</button>
        </div>

        <section className='purchase-guidance-header'>
          <p>Distressed Assistance</p>
          <h1>Purchase Guidance</h1>
          <span>Follow these five simple steps to complete your order with confidence.</span>
        </section>

        <section className='purchase-guidance-content'>
          <div className='purchase-guidance-slider'>
            <img key={step.image} src={step.image} alt={`Purchase guidance step ${currentStep + 1}`} />
            <button type='button' onClick={previousStep} className='purchase-guidance-arrow purchase-guidance-arrow-left' aria-label='Previous step'><FiChevronLeft /></button>
            <button type='button' onClick={nextStep} className='purchase-guidance-arrow purchase-guidance-arrow-right' aria-label='Next step'><FiChevronRight /></button>
          </div>

          <div className='purchase-guidance-dots'>
            {purchaseSteps.map((item, index) => <button key={item.title} type='button' onClick={() => setCurrentStep(index)} className={currentStep === index ? 'active' : ''} aria-label={`View step ${index + 1}`}></button>)}
          </div>

          <div className='purchase-guidance-description'>
            <span>Step {String(currentStep + 1).padStart(2, '0')}</span>
            <div>
              <h2>{step.title}</h2>
              <p>{step.description}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default PurchaseGuidance
