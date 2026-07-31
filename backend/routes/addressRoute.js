import express from 'express'
import authUser from '../middleware/auth.js'
import { getSavedAddresses, saveAddress, deleteAddress } from '../controllers/addressController.js'

const addressRouter = express.Router()

addressRouter.post('/list', authUser, getSavedAddresses)
addressRouter.post('/save', authUser, saveAddress)
addressRouter.post('/delete', authUser, deleteAddress)

export default addressRouter