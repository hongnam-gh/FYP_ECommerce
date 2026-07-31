import { getSavedAddressesService, saveAddressService, deleteAddressService } from '../services/addressService.js'

const getSavedAddresses = async (req, res) => {
  try {
    const { userId } = req.body
    res.json(await getSavedAddressesService(userId))
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const saveAddress = async (req, res) => {
  try {
    const { userId, address } = req.body
    res.json(await saveAddressService(userId, address))
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const deleteAddress = async (req, res) => {
  try {
    const { userId, addressId } = req.body
    res.json(await deleteAddressService(userId, addressId))
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

export { getSavedAddresses, saveAddress, deleteAddress }
