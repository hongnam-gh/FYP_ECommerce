import materialModel from '../models/materialModel.js'

// ------ Public Services --------

const addMaterialService = async ({ name }) => {
  if (!name) return { success: false, message: 'Material name is required' }

  const exists = await materialModel.findOne({ name })
  if (exists) return { success: false, message: 'Material already exists' }

  const material = new materialModel({ name })
  await material.save()

  return { success: true, message: 'Material added', material }
}

const listMaterialsService = async () => {
  const materials = await materialModel.find({}).sort({ date: 1 })
  return { success: true, materials }
}

const updateMaterialService = async ({ id, name }) => {
  if (!id || !name) return { success: false, message: 'Material data is required' }

  const exists = await materialModel.findOne({ name, _id: { $ne: id } })
  if (exists) return { success: false, message: 'Material already exists' }

  const material = await materialModel.findByIdAndUpdate(id, { name }, { new: true })
  return { success: true, message: 'Material updated', material }
}

const deleteMaterialService = async ({ id }) => {
  if (!id) return { success: false, message: 'Material id is required' }

  await materialModel.findByIdAndDelete(id)
  return { success: true, message: 'Material deleted' }
}

export { addMaterialService, listMaterialsService, updateMaterialService, deleteMaterialService }
