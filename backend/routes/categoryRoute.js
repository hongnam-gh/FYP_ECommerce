import express from 'express'
import { addCategory, listCategories, updateCategory, deleteCategory } from '../controllers/categoryController.js'
import adminAuth from '../middleware/adminAuth.js'

const categoryRouter = express.Router()

categoryRouter.post('/add', adminAuth, addCategory)
categoryRouter.get('/list', listCategories)
categoryRouter.post('/update', adminAuth, updateCategory)
categoryRouter.post('/delete', adminAuth, deleteCategory)

export default categoryRouter