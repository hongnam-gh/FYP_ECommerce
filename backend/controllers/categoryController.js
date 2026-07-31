import { addCategoryService, listCategoriesService, updateCategoryService, deleteCategoryService } from '../services/categoryService.js'

const addCategory = async (req, res) => {
  try {
    res.json(await addCategoryService(req.body))
  } catch (error) {
    console.error(error)
    res.json({ success: false, message: error.message })
  }
}

const listCategories = async (req, res) => {
  try {
    res.json(await listCategoriesService())
  } catch (error) {
    console.error(error)
    res.json({ success: false, message: error.message })
  }
}

const updateCategory = async (req, res) => {
  try {
    res.json(await updateCategoryService(req.body))
  } catch (error) {
    console.error(error)
    res.json({ success: false, message: error.message })
  }
}

const deleteCategory = async (req, res) => {
  try {
    res.json(await deleteCategoryService(req.body))
  } catch (error) {
    console.error(error)
    res.json({ success: false, message: error.message })
  }
}

export { addCategory, listCategories, updateCategory, deleteCategory }
