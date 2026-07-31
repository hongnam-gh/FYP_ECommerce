import { googleLoginService, facebookLoginService } from '../services/socialAuthService.js'

const googleLogin = async (req, res) => {
  try {
    res.json(await googleLoginService(req.body))
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const facebookLogin = async (req, res) => {
  try {
    res.json(await facebookLoginService(req.body))
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

export { googleLogin, facebookLogin }
