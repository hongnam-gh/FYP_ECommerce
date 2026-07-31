import { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useGoogleLogin } from '@react-oauth/google'
import useAuth from './useAuth'
import { mergeGuestCart } from './useCart'
import { backendUrl } from '../constants/shopConfig'
import { queueAuthSuccessToast } from '../utils/authToast'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID
const facebookApiVersion = import.meta.env.VITE_FACEBOOK_API_VERSION || 'v25.0'
let facebookSdkPromise = null

const loadFacebookSdk = () => {
  if (window.FB) return Promise.resolve(window.FB)
  if (facebookSdkPromise) return facebookSdkPromise

  facebookSdkPromise = new Promise((resolve, reject) => {
    window.fbAsyncInit = () => {
      window.FB.init({ appId: facebookAppId, cookie: true, xfbml: false, version: facebookApiVersion })
      resolve(window.FB)
    }

    const script = document.createElement('script')
    script.id = 'facebook-jssdk'
    script.src = 'https://connect.facebook.net/en_US/sdk.js'
    script.async = true
    script.defer = true
    script.onerror = () => reject(new Error('Facebook SDK could not be loaded'))
    document.body.appendChild(script)
  })

  return facebookSdkPromise
}

const useSocialAuth = () => {
  const { setToken } = useAuth()
  const [socialLoading, setSocialLoading] = useState('')

  const finishSocialLogin = async (provider, accessToken) => {
    try {
      setSocialLoading(provider)
      const response = await axios.post(backendUrl + `/api/social-auth/${provider}`, { accessToken })

      if (response.data.success) {
        await mergeGuestCart(response.data.token)
        queueAuthSuccessToast('Login successful. Welcome back!')
        setToken(response.data.token)
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setSocialLoading('')
    }
  }

  const googleAuth = useGoogleLogin({
    scope: 'openid email profile',
    onSuccess: (response) => finishSocialLogin('google', response.access_token),
    onError: () => toast.error('Google login failed')
  })

  const loginGoogle = () => {
    if (!googleClientId) {
      toast.error('Google login is not configured')
      return
    }

    googleAuth()
  }

  const loginFacebook = async () => {
    if (!facebookAppId) {
      toast.error('Facebook login is not configured')
      return
    }

    try {
      setSocialLoading('facebook')
      const facebook = await loadFacebookSdk()

      facebook.login((response) => {
        if (response.authResponse?.accessToken) {
          finishSocialLogin('facebook', response.authResponse.accessToken)
        } else {
          setSocialLoading('')
          toast.error('Facebook login was cancelled')
        }
      }, { scope: 'public_profile,email' })
    } catch (error) {
      console.log(error)
      setSocialLoading('')
      toast.error(error.message)
    }
  }

  return { loginGoogle, loginFacebook, socialLoading }
}

export default useSocialAuth
