import React from 'react'
import useCart from '../hooks/useCart'
import { currency } from '../constants/shopConfig'


const CartTotal = ({ pricing, onView }) => {

    const { getCartAmount } = useCart();
    const subtotal = pricing?.subtotal ?? getCartAmount()
    const discountPercent = Number(pricing?.discountPercent || 0)
    const discountAmount = pricing?.discountAmount ?? Number((subtotal * discountPercent / 100).toFixed(2))
    const shippingFee = pricing?.deliveryFee
    const total = pricing?.amount

  return (
    <div className='w-full'>
      <div className='place-order-cart-total-head text-2xl'>
        <h1 className="title"><span className="title-text">CART <span className="title-highlight">TOTALS</span></span><span className="title-line"></span></h1>
        {onView && <button type='button' onClick={onView}>View</button>}
      </div>
      
      <div className='flex flex-col gap-2 mt-2 text-sm'>
            <div className='flex justify-between'>
                <p>Subtotal</p>
                <p>{currency} {subtotal}</p>
            </div>
            <hr />
            {discountPercent > 0 && (
              <>
                <div className='flex justify-between'>
                    <p>{pricing?.rank || 'Member'} Discount ({discountPercent}%)</p>
                    <p>-{currency} {discountAmount}</p>
                </div>
                <hr />
              </>
            )}
            <div className='flex justify-between'>
                <p>Shipping Fee</p>
                <p>{shippingFee === undefined ? 'Loading...' : shippingFee === 0 ? 'Free' : `${currency} ${shippingFee}`}</p>
            </div>
            <hr />
            <div className='flex justify-between'>
                <b>Total</b>
                <b>{subtotal === 0 ? `${currency} 0` : total === undefined ? 'Loading...' : `${currency} ${total}`}</b>

            </div>
      </div>
    </div>
  )
}

export default CartTotal
