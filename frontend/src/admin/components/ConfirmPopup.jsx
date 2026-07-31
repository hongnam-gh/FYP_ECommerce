import React from 'react'
import { FiAlertTriangle } from 'react-icons/fi'
import './ConfirmPopup.css'

const ConfirmPopup = ({ title, message, confirmText, loading, onCancel, onConfirm }) => {
  return (
    <div className='confirm-popup-overlay' onMouseDown={onCancel}>
      <div className='confirm-popup' onMouseDown={(event) => event.stopPropagation()}>
        <div className='confirm-popup-icon'><FiAlertTriangle /></div>
        <h2>{title}</h2>
        <p>{message}</p>

        <div className='confirm-popup-actions'>
          <button type='button' onClick={onCancel} disabled={loading}>Cancel</button>
          <button type='button' onClick={onConfirm} disabled={loading}>{loading ? 'Processing...' : confirmText}</button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmPopup
