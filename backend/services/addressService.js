import addressModel from '../models/addressModel.js'

// ------ Public Services --------

const getSavedAddressesService = async (userId) => {
  const addresses = await addressModel.find({ userId }).sort({ date: -1 }).limit(2)
  return { success: true, addresses }
}

const saveAddressService = async (userId, address) => {
  const count = await addressModel.countDocuments({ userId })
  if (count >= 2) throw new Error('You can only save up to 2 delivery information cards')

  const newAddress = new addressModel({ userId, ...address, date: Date.now() })
  await newAddress.save()

  const addresses = await addressModel.find({ userId }).sort({ date: -1 })

  if (addresses.length > 2) {
    await addressModel.findByIdAndDelete(newAddress._id)
    throw new Error('You can only save up to 2 delivery information cards')
  }

  return { success: true, message: 'Delivery information saved', address: newAddress }
}

const deleteAddressService = async (userId, addressId) => {
  await addressModel.findOneAndDelete({ _id: addressId, userId })
  return { success: true, message: 'Saved delivery information removed' }
}

export { getSavedAddressesService, saveAddressService, deleteAddressService }
