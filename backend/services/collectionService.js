import { v2 as cloudinary } from 'cloudinary'
import collectionModel from '../models/collectionModel.js'
import productModel from '../models/productModel.js'

// ------ Config --------

let collectionMigrationPromise = null

// ------ Business Helpers --------

const normalizeCollectionRoute = (value) => {
  const routeName = value
    .trim()
    .replace(/^\/collection\//i, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '')

  return routeName ? `/collection/${routeName}` : ''
}

const uploadBannerImage = async (file) => {
  if (!file) return ''

  const largeGif = file.mimetype === 'image/gif' && file.size > 10 * 1024 * 1024
  const result = await cloudinary.uploader.upload(file.path, { resource_type: largeGif ? 'video' : 'auto' })
  return result.secure_url
}

// ------ Database Helpers --------

const runCollectionMigration = async () => {
  const currentCollections = await collectionModel.find({})

  await collectionModel.updateMany({ gender: { $exists: false } }, { $set: { gender: 'Unisex' } })
  await collectionModel.updateMany({ order: { $exists: true } }, { $unset: { order: 1 } })

  for (const currentCollection of currentCollections) {
    const hasCollectionRoute = currentCollection.path?.startsWith('/collection/') && currentCollection.path.toLowerCase() !== '/collection/view-all'
    if (hasCollectionRoute) continue

    let collectionPath = normalizeCollectionRoute(currentCollection.name)
    const duplicatedPath = await collectionModel.findOne({ _id: { $ne: currentCollection._id }, path: collectionPath })
    if (duplicatedPath) collectionPath = `${collectionPath}_${String(currentCollection._id).slice(-6)}`
    await collectionModel.findByIdAndUpdate(currentCollection._id, { path: collectionPath })
  }

  await productModel.collection.updateMany(
    { $or: [{ collectionId: { $exists: true } }, { collection: { $exists: true } }] },
    { $unset: { collectionId: 1, collection: 1 } }
  )
}

const migrateCollectionData = async () => {
  if (!collectionMigrationPromise) {
    collectionMigrationPromise = runCollectionMigration().catch((error) => {
      collectionMigrationPromise = null
      throw error
    })
  }
  return collectionMigrationPromise
}

const getCollections = async () => {
  return collectionModel.find({}).sort({ date: 1 })
}

// ------ Public Services --------

const listCollectionsService = async () => {
  await migrateCollectionData()
  const collections = await getCollections()
  return { success: true, collections }
}

const saveCollectionService = async (body, file) => {
  const { id, name, route, path, gender } = body
  if (!name?.trim()) return { success: false, message: 'Collection name is required' }

  const collectionPath = normalizeCollectionRoute(route || path || '')
  if (!collectionPath) return { success: false, message: 'Collection route is required' }
  if (collectionPath.toLowerCase() === '/collection/view-all') return { success: false, message: 'This collection route is reserved' }

  const routeCollections = await collectionModel.find(id ? { _id: { $ne: id } } : {})
  if (routeCollections.some((item) => (item.path || '').toLowerCase() === collectionPath.toLowerCase())) return { success: false, message: 'Collection route already exists' }

  const currentCollection = id ? await collectionModel.findById(id) : null
  if (id && !currentCollection) return { success: false, message: 'Collection not found' }

  const collectionGender = gender || currentCollection?.gender || 'Unisex'
  if (!['Men', 'Women', 'Unisex'].includes(collectionGender)) return { success: false, message: 'Collection gender is invalid' }

  const uploadedImage = await uploadBannerImage(file)
  const image = uploadedImage || currentCollection?.image || ''
  if (!image) return { success: false, message: 'Collection card banner is required' }

  const collectionData = { name: name.trim(), path: collectionPath, image, gender: collectionGender }
  const collection = currentCollection
    ? await collectionModel.findByIdAndUpdate(id, collectionData, { new: true, runValidators: true })
    : await collectionModel.create({ ...collectionData, products: [], date: Date.now() })

  const collections = await getCollections()
  return { success: true, message: currentCollection ? 'Collection updated successfully' : 'Collection added successfully', collection: collections.find((item) => String(item._id) === String(collection._id)) }
}

const removeCollectionService = async (id) => {
  const collection = await collectionModel.findByIdAndDelete(id)
  if (!collection) return { success: false, message: 'Collection not found' }

  return { success: true, message: 'Collection removed' }
}

const assignCollectionProductService = async (body) => {
  const { collectionId, productId, remove = false } = body
  const collection = await collectionModel.findById(collectionId)
  if (!collection) return { success: false, message: 'Collection not found' }

  const product = await productModel.findById(productId)
  if (!product) return { success: false, message: 'Product not found' }

  if (remove) {
    if (!collection.products.some((item) => String(item) === String(product._id))) return { success: false, message: 'Product does not belong to this collection' }
    await collectionModel.findByIdAndUpdate(collectionId, { $pull: { products: product._id } })
  } else {
    await collectionModel.updateMany({ _id: { $ne: collectionId } }, { $pull: { products: product._id } })
    await collectionModel.findByIdAndUpdate(collectionId, { $addToSet: { products: product._id } })
  }

  const collections = await getCollections()
  return { success: true, message: remove ? 'Product removed from collection' : 'Product added to collection', collections }
}

export { assignCollectionProductService, listCollectionsService, migrateCollectionData, removeCollectionService, saveCollectionService }
