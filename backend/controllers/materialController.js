import { addMaterialService, listMaterialsService, updateMaterialService, deleteMaterialService } from '../services/materialService.js'

const addMaterial = async (req, res) => {
  try {
    res.json(await addMaterialService(req.body))
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const listMaterials = async (req, res) => {
  try {
    res.json(await listMaterialsService())
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const updateMaterial = async (req, res) => {
  try {
    res.json(await updateMaterialService(req.body))
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const deleteMaterial = async (req, res) => {
  try {
    res.json(await deleteMaterialService(req.body))
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

export { addMaterial, listMaterials, updateMaterial, deleteMaterial }
