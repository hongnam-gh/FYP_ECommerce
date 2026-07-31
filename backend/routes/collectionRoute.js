import express from 'express'
import { assignCollectionProduct, listCollections, removeCollection, saveCollection } from '../controllers/collectionController.js'
import upload from '../middleware/multer.js'
import adminAuth from '../middleware/adminAuth.js'

const collectionRouter = express.Router()

collectionRouter.get('/list', listCollections)
collectionRouter.post('/save', adminAuth, upload.single('image'), saveCollection)
collectionRouter.post('/remove', adminAuth, removeCollection)
collectionRouter.post('/assign-product', adminAuth, assignCollectionProduct)

export default collectionRouter
