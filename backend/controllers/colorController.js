import { addColorService, listColorsService, updateColorService, deleteColorService } from '../services/colorService.js'

const addColor = async (req, res) => {
  try {
    res.json(await addColorService(req.body))
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const listColors = async (req, res) => {
  try {
    res.json(await listColorsService())
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const updateColor = async (req, res) => {
  try {
    res.json(await updateColorService(req.body))
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const deleteColor = async (req, res) => {
  try {
    res.json(await deleteColorService(req.body))
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

export { addColor, listColors, updateColor, deleteColor }
