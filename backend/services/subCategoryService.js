import subCategoryModel from '../models/subCategoryModel.js'

// ------ Public Services --------

const addSubCategoryService = async ({ name }) => {
  if (!name) return { success: false, message: 'Sub category name is required' }

  const exists = await subCategoryModel.findOne({ name })
  if (exists) return { success: false, message: 'Sub category already exists' }

  const subCategory = new subCategoryModel({ name })
  await subCategory.save()

  return { success: true, message: 'Sub category added', subCategory }
}

const listSubCategoriesService = async () => {
  const subCategories = await subCategoryModel.find({}).sort({ date: 1 })
  return { success: true, subCategories }
}

const updateSubCategoryService = async ({ id, name }) => {
  if (!id || !name) return { success: false, message: 'Sub category data is required' }

  const exists = await subCategoryModel.findOne({ name, _id: { $ne: id } })
  if (exists) return { success: false, message: 'Sub category already exists' }

  const subCategory = await subCategoryModel.findByIdAndUpdate(id, { name }, { new: true })
  return { success: true, message: 'Sub category updated', subCategory }
}

const deleteSubCategoryService = async ({ id }) => {
  if (!id) return { success: false, message: 'Sub category id is required' }

  await subCategoryModel.findByIdAndDelete(id)
  return { success: true, message: 'Sub category deleted' }
}

export { addSubCategoryService, listSubCategoriesService, updateSubCategoryService, deleteSubCategoryService }
