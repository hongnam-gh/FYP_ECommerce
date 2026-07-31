import { addSubCategoryService, listSubCategoriesService, updateSubCategoryService, deleteSubCategoryService } from '../services/subCategoryService.js'

const addSubCategory = async (req, res) => {
  try {
    res.json(await addSubCategoryService(req.body))
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const listSubCategories = async (req, res) => {
  try {
    res.json(await listSubCategoriesService())
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const updateSubCategory = async (req, res) => {
  try {
    res.json(await updateSubCategoryService(req.body))
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const deleteSubCategory = async (req, res) => {
  try {
    res.json(await deleteSubCategoryService(req.body))
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

export { addSubCategory, listSubCategories, updateSubCategory, deleteSubCategory }
