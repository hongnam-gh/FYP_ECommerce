import axios from 'axios'
import jwt from 'jsonwebtoken'
import userModel from '../models/userModel.js'
import socialAuthModel from '../models/socialAuthModel.js'

// ------ Business Helpers --------

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET)
}

const getSocialUser = async ({ provider, providerId, name, email, avatar }) => {
  const socialAuth = await socialAuthModel.findOne({ provider, providerId })

  if (socialAuth) {
    const user = await userModel.findById(socialAuth.userId)
    if (user) {
      user.avatar = avatar || ''
      await user.save()

      socialAuth.email = email
      socialAuth.avatar = avatar
      await socialAuth.save()

      return { success: true, token: createToken(user._id) }
    }
    await socialAuthModel.findByIdAndDelete(socialAuth._id)
  }

  let user = await userModel.findOne({ email })

  if (!user) {
    user = new userModel({ name, email, avatar })
    await user.save()
  } else {
    user.avatar = avatar || ''
    await user.save()
  }

  await socialAuthModel.findOneAndUpdate(
    { userId: user._id, provider },
    { providerId, email, avatar },
    { upsert: true, new: true }
  )

  return { success: true, token: createToken(user._id) }
}

// ------ Public Services --------

const googleLoginService = async ({ accessToken }) => {
  if (!accessToken) return { success: false, message: 'Google access token is required' }
  if (!process.env.GOOGLE_CLIENT_ID) return { success: false, message: 'Google login is not configured' }

  const tokenResponse = await axios.get('https://oauth2.googleapis.com/tokeninfo', { params: { access_token: accessToken } })
  if (tokenResponse.data.aud !== process.env.GOOGLE_CLIENT_ID) return { success: false, message: 'Invalid Google access token' }

  const profileResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${accessToken}` } })
  const profile = profileResponse.data

  if (!profile.sub || !profile.email || !profile.email_verified) return { success: false, message: 'Google account email is not verified' }

  return getSocialUser({
    provider: 'google',
    providerId: profile.sub,
    name: profile.name || profile.email.split('@')[0],
    email: profile.email,
    avatar: profile.picture || ''
  })
}

const facebookLoginService = async ({ accessToken }) => {
  if (!accessToken) return { success: false, message: 'Facebook access token is required' }
  if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) return { success: false, message: 'Facebook login is not configured' }

  const facebookApiVersion = process.env.FACEBOOK_API_VERSION || 'v25.0'
  const appAccessToken = `${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}`
  const debugResponse = await axios.get(`https://graph.facebook.com/${facebookApiVersion}/debug_token`, { params: { input_token: accessToken, access_token: appAccessToken } })
  const tokenData = debugResponse.data.data

  if (!tokenData?.is_valid || String(tokenData.app_id) !== String(process.env.FACEBOOK_APP_ID)) return { success: false, message: 'Invalid Facebook access token' }

  const profileResponse = await axios.get(`https://graph.facebook.com/${facebookApiVersion}/me`, { params: { fields: 'id,name,email,picture.type(large)', access_token: accessToken } })
  const profile = profileResponse.data

  if (!profile.id || profile.id !== tokenData.user_id) return { success: false, message: 'Invalid Facebook account' }
  const email = profile.email || `facebook_${profile.id}@facebook.local`

  return getSocialUser({
    provider: 'facebook',
    providerId: profile.id,
    name: profile.name || 'Facebook User',
    email,
    avatar: profile.picture?.data?.url || ''
  })
}

export { googleLoginService, facebookLoginService }
