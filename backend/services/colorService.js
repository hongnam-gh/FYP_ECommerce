import colorModel from '../models/colorModel.js'

// ------ Public Services --------

const addColorService = async ({ name }) => {
  if (!name) return { success: false, message: 'Color name is required' }

  const exists = await colorModel.findOne({ name })
  if (exists) return { success: false, message: 'Color already exists' }

  const color = new colorModel({ name })
  await color.save()

  return { success: true, message: 'Color added', color }
}

const listColorsService = async () => {
  const colors = await colorModel.find({}).sort({ date: 1 })
  return { success: true, colors }
}

const updateColorService = async ({ id, name }) => {
  if (!id || !name) return { success: false, message: 'Color data is required' }

  const exists = await colorModel.findOne({ name, _id: { $ne: id } })
  if (exists) return { success: false, message: 'Color already exists' }

  const color = await colorModel.findByIdAndUpdate(id, { name }, { new: true })
  return { success: true, message: 'Color updated', color }
}

const deleteColorService = async ({ id }) => {
  if (!id) return { success: false, message: 'Color id is required' }

  await colorModel.findByIdAndDelete(id)
  return { success: true, message: 'Color deleted' }
}

export { addColorService, listColorsService, updateColorService, deleteColorService }
