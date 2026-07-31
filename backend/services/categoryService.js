import categoryModel from '../models/categoryModel.js'

// ------ Public Services --------

const addCategoryService = async ({ name }) => {
  if (!name) return { success: false, message: 'Category name is required' }

  const exists = await categoryModel.findOne({ name })
  if (exists) return { success: false, message: 'Category already exists' }

  const category = new categoryModel({ name })
  await category.save()

  return { success: true, message: 'Category added', category }
}

const listCategoriesService = async () => {
  const categories = await categoryModel.find({}).sort({ date: 1 })
  return { success: true, categories }
}

const updateCategoryService = async ({ id, name }) => {
  if (!id || !name) return { success: false, message: 'Category data is required' }

  const exists = await categoryModel.findOne({ name, _id: { $ne: id } })
  if (exists) return { success: false, message: 'Category already exists' }

  const category = await categoryModel.findByIdAndUpdate(id, { name }, { new: true })
  return { success: true, message: 'Category updated', category }
}

const deleteCategoryService = async ({ id }) => {
  if (!id) return { success: false, message: 'Category id is required' }

  await categoryModel.findByIdAndDelete(id)
  return { success: true, message: 'Category deleted' }
}

export { addCategoryService, listCategoriesService, updateCategoryService, deleteCategoryService }
