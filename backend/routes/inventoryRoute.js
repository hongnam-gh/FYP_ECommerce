import express from 'express'
import { listInventory, singleInventory, updateInventory } from '../controllers/inventoryController.js'
import adminAuth from '../middleware/adminAuth.js'

const inventoryRouter = express.Router()

inventoryRouter.get('/list', adminAuth, listInventory)

inventoryRouter.post('/single-public', singleInventory)

inventoryRouter.post('/single', adminAuth, singleInventory)

inventoryRouter.post('/update', adminAuth, updateInventory)

export default inventoryRouter