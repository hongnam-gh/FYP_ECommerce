import express from 'express'
import { getStatistics } from '../controllers/statisticsController.js'
import adminAuth from '../middleware/adminAuth.js'

const statisticsRouter = express.Router()

statisticsRouter.post('/dashboard', adminAuth, getStatistics)

export default statisticsRouter
