import express from 'express'
import { addSubCategory, listSubCategories, updateSubCategory, deleteSubCategory } from '../controllers/subCategoryController.js'
import adminAuth from '../middleware/adminAuth.js'

const subCategoryRouter = express.Router()

subCategoryRouter.post('/add', adminAuth, addSubCategory)
subCategoryRouter.get('/list', listSubCategories)
subCategoryRouter.post('/update', adminAuth, updateSubCategory)
subCategoryRouter.post('/delete', adminAuth, deleteSubCategory)

export default subCategoryRouter