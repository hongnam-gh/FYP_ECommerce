import express from 'express'
import { listBanners, removeBanner, saveBanner } from '../controllers/bannerController.js'
import upload from '../middleware/multer.js'
import adminAuth from '../middleware/adminAuth.js'

const bannerRouter = express.Router()

bannerRouter.get('/list', listBanners)
bannerRouter.post('/save', adminAuth, upload.single('image'), saveBanner)
bannerRouter.post('/remove', adminAuth, removeBanner)

export default bannerRouter
