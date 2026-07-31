import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { assets } from '../../assets/assets'
import axios from 'axios'
import { useParams } from 'react-router-dom'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { backendUrl } from '../../constants/shopConfig'
import { queueAuthSuccessToast } from '../../utils/authToast'
import './ResetPassword.css'

const ResetPassword = () => {
  const { token } = useParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const onSubmitHandler = async (event) => {
    event.preventDefault()

    try {
      setLoading(true)
      const response = await axios.post(backendUrl + '/api/user/reset-password/' + token, { password, confirmPassword })

      if (response.data.success) {
        queueAuthSuccessToast(response.data.message)
        window.location.href = '/login'
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='reset-page' style={{ backgroundImage: `linear-gradient(rgba(0,0,0,.25), rgba(0,0,0,.25)), url(${assets.dashboard_img})` }}>
      <form onSubmit={onSubmitHandler} className='reset-form'>
        <div className='reset-header'>
          <p className='prata-regular reset-title'>Reset Password</p>
          <div className='reset-line'></div>
          <p className='reset-subtitle'>Create a new password for your account</p>
        </div>

        <div className='reset-fields'>
          <div className='reset-input-box'>
            <input onChange={(e) => setPassword(e.target.value)} value={password} type={showPassword ? 'text' : 'password'} className='reset-input' placeholder='New Password' required />
            <button type='button' onClick={() => setShowPassword(!showPassword)} className='reset-eye-btn'>{showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}</button>
          </div>

          <div className='reset-input-box'>
            <input onChange={(e) => setConfirmPassword(e.target.value)} value={confirmPassword} type={showConfirmPassword ? 'text' : 'password'} className='reset-input' placeholder='Confirm Password' required />
            <button type='button' onClick={() => setShowConfirmPassword(!showConfirmPassword)} className='reset-eye-btn'>{showConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}</button>
          </div>
        </div>

        <button disabled={loading} type='submit' className='reset-btn'>{loading ? 'Resetting...' : 'Reset Password'}</button>

        <div className='reset-divider'>
          <div className='reset-divider-line'></div>
          <p className='reset-divider-text'>PASSWORD UPDATE</p>
          <div className='reset-divider-line'></div>
        </div>

        <p className='reset-note'>After resetting your password, you can sign in again with your new credentials.</p>
      </form>
    </div>
  )
}

export default ResetPassword
