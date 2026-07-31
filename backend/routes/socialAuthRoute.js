import express from 'express'
import { googleLogin, facebookLogin } from '../controllers/socialAuthController.js'

const socialAuthRouter = express.Router()

socialAuthRouter.post('/google', googleLogin)
socialAuthRouter.post('/facebook', facebookLogin)

export default socialAuthRouter
