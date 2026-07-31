import React from 'react'
import { FiHelpCircle, FiMail, FiMessageCircle } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'
import './CustomerService.css'

const CustomerService = () => {
  const navigate = useNavigate()

  const sendEmail = () => {
    window.location.href = 'mailto:distressed@gmail.com'
  }

  const openChat = () => {
    window.dispatchEvent(new Event('open-chat'))
  }

  return (
    <div className='customer-service-page'>
      <section style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, .42), rgba(0, 0, 0, .42)), url(${assets.customer_service_theme})` }} className='customer-service-intro'>
        <p className='customer-service-label'>Distressed Assistance</p>
        <h1>Customer Service</h1>
        <p>Our Customer Service team is available to assist you with your online orders, products and account enquiries.</p>
        <div className='customer-service-hours'>
          <span>Service Hours</span>
          <b>Monday to Sunday, 08:00 - 22:00</b>
        </div>
      </section>

      <section className='customer-service-options'>
        <div style={{ backgroundImage: `url(${assets.pink_purple_gradient})` }} className='customer-service-option customer-service-option-black'>
          <span className='customer-service-option-icon'><FiHelpCircle /></span>
          <h2>Frequently Asked Questions</h2>
          <p>Get direct support for your orders, products and account.</p>
          <button type='button' onClick={() => navigate('/faq')}>View Questions</button>
        </div>

        <div style={{ backgroundImage: `url(${assets.blue_gradient_two})` }} className='customer-service-option customer-service-option-blue'>
          <span className='customer-service-option-icon'><FiMail /></span>
          <h2>Email Us</h2>
          <p>Our Customer Service team will reply as soon as possible.</p>
          <button type='button' onClick={sendEmail}>Send a Message</button>
        </div>

        <div style={{ backgroundImage: `url(${assets.green_gradient})` }} className='customer-service-option'>
          <span className='customer-service-option-icon'><FiMessageCircle /></span>
          <h2>Live Chat</h2>
          <p>Chat directly with our support team.</p>
          <button type='button' onClick={openChat}>Start Live Chat</button>
        </div>
      </section>
    </div>
  )
}

export default CustomerService
