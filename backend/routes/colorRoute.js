import express from 'express'
import { addColor, listColors, updateColor, deleteColor } from '../controllers/colorController.js'
import adminAuth from '../middleware/adminAuth.js'

const colorRouter = express.Router()

colorRouter.post('/add', adminAuth, addColor)
colorRouter.get('/list', listColors)
colorRouter.post('/update', adminAuth, updateColor)
colorRouter.post('/delete', adminAuth, deleteColor)

export default colorRouter
