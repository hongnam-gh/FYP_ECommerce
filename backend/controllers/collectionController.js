import { assignCollectionProductService, listCollectionsService, removeCollectionService, saveCollectionService } from '../services/collectionService.js'

const listCollections = async (req, res) => {
  try {
    res.json(await listCollectionsService())
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const saveCollection = async (req, res) => {
  try {
    res.json(await saveCollectionService(req.body, req.file))
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const removeCollection = async (req, res) => {
  try {
    res.json(await removeCollectionService(req.body.id))
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const assignCollectionProduct = async (req, res) => {
  try {
    res.json(await assignCollectionProductService(req.body))
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

export { assignCollectionProduct, listCollections, removeCollection, saveCollection }
