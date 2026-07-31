import express from 'express'
import { addMaterial, listMaterials, updateMaterial, deleteMaterial } from '../controllers/materialController.js'
import adminAuth from '../middleware/adminAuth.js'

const materialRouter = express.Router()

materialRouter.post('/add', adminAuth, addMaterial)
materialRouter.get('/list', listMaterials)
materialRouter.post('/update', adminAuth, updateMaterial)
materialRouter.post('/delete', adminAuth, deleteMaterial)

export default materialRouter
