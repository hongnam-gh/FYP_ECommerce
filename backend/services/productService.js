import { v2 as cloudinary } from 'cloudinary'
import productModel from '../models/productModel.js'
import inventoryModel from '../models/inventoryModel.js'
import collectionModel from '../models/collectionModel.js'

// ------ Business Helpers --------

const validateProductCode = (code) => {
  const productCode = code?.trim()
  if (!productCode) throw new Error('Product code is required')
  if (!/^[A-Z0-9]+$/.test(productCode)) throw new Error('Product code can only contain uppercase letters and numbers')

  return productCode
}

const validateProductName = (name) => {
  const productName = name?.trim()
  if (!productName) throw new Error('Product name is required')

  return productName
}

const validateProductImages = (files) => {
  if (!files?.image1?.[0] || !files?.image2?.[0] || !files?.image3?.[0] || !files?.image4?.[0]) {
    throw new Error('Please upload all 4 product images before adding this product')
  }
}

const validateUniqueProductName = async (name, productId = null) => {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const query = { name: { $regex: `^${escapedName}$`, $options: 'i' } }
  if (productId) query._id = { $ne: productId }

  const existingProduct = await productModel.exists(query)
  if (existingProduct) throw new Error('Product name already exists')
}

const validateUniqueProductCode = async (code, productId = null) => {
  const query = { code }
  if (productId) query._id = { $ne: productId }

  const existingProduct = await productModel.exists(query)
  if (existingProduct) throw new Error('Product code already exists')
}

const uploadProductImages = async (files, oldImages = []) => {
  const image1 = files?.image1 ? files.image1[0] : null
  const image2 = files?.image2 ? files.image2[0] : null
  const image3 = files?.image3 ? files.image3[0] : null
  const image4 = files?.image4 ? files.image4[0] : null

  const images = [image1, image2, image3, image4]

  const imagesUrl = await Promise.all(images.map(async (item, index) => {
    if (!item) return oldImages[index] || null

    const result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' })
    return result.secure_url
  }))

  return imagesUrl.filter(Boolean)
}

const validateProductCollection = async (collectionId) => {
  if (!collectionId) return null

  const selectedCollection = await collectionModel.findById(collectionId)
  if (!selectedCollection) throw new Error('Selected collection not found')

  return selectedCollection._id
}

const parseProductOptions = (value) => {
  if (Array.isArray(value)) return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))]

  try {
    const parsedValue = JSON.parse(value || '[]')
    if (Array.isArray(parsedValue)) return [...new Set(parsedValue.map((item) => String(item).trim()).filter(Boolean))]
  } catch {
    return value?.trim() ? [value.trim()] : []
  }

  return value?.trim() ? [value.trim()] : []
}

const parseProductSizes = (value) => {
  const parsedSizes = JSON.parse(value || '[]')
  if (!Array.isArray(parsedSizes)) throw new Error('Please select at least one product size')

  const normalizedSizes = [...new Set(parsedSizes.map((size) => String(size).trim()).filter(Boolean))]
  if (normalizedSizes.length === 0) throw new Error('Please select at least one product size')

  return normalizedSizes
}

const emptyAdvancedFilters = {
  availability: [],
  materials: [],
  colors: [],
  sizes: [],
  subCategories: []
}

const hasSelectedValue = (selectedValues, value) => {
  const productValues = Array.isArray(value) ? value : value ? [value] : []
  return selectedValues.length === 0 || productValues.some((item) => selectedValues.includes(item))
}

const normalizeSubCategory = (subCategory) => {
  const subCategoryMap = {
    Topwear: 'Tops & Shirts',
    TopsShirts: 'Tops & Shirts',
    Winterwear: 'Outerwear & Jacket',
    Outerwears: 'Outerwear & Jacket',
    Bottomwear: 'Bottom Wear',
    CharmsStuff: 'Charms & Stuff'
  }

  return subCategoryMap[subCategory] || subCategory
}

const filterProductsByAdvanced = (products, filters = emptyAdvancedFilters) => {
  return products.filter((item) => {
    const totalStock = Object.values(item.stock || {}).reduce((total, quantity) => total + Number(quantity || 0), 0)
    const selectedSizeStock = (filters.sizes || []).reduce((total, size) => total + Number(item.stock?.[size] || 0), 0)
    const availableStock = filters.sizes?.length > 0 ? selectedSizeStock : totalStock
    const matchesAvailability = !filters.availability?.length ||
      (filters.availability.includes('in-stock') && availableStock > 0) ||
      (filters.availability.includes('out-of-stock') && availableStock <= 0)
    const matchesMaterial = hasSelectedValue(filters.materials || [], item.material)
    const matchesColor = hasSelectedValue(filters.colors || [], item.color)
    const matchesSize = !filters.sizes?.length || item.sizes?.some((size) => filters.sizes.includes(size))
    const matchesSubCategory = hasSelectedValue(filters.subCategories || [], normalizeSubCategory(item.subCategory))

    return matchesAvailability && matchesMaterial && matchesColor && matchesSize && matchesSubCategory
  })
}

// ------ Public Services --------

const addProductService = async (body, files) => {
  const { name, code, description, price, category, subcategory, material, color, collectionId, sizes, newarrival } = body

  validateProductImages(files)
  const productName = validateProductName(name)
  const productCode = validateProductCode(code)
  await validateUniqueProductName(productName)
  await validateUniqueProductCode(productCode)
  const selectedCollectionId = await validateProductCollection(collectionId)
  const parsedMaterials = parseProductOptions(material)
  const parsedColors = parseProductOptions(color)
  if (parsedMaterials.length === 0) throw new Error('Product material is required')
  if (parsedColors.length === 0) throw new Error('Product color is required')

  const imagesUrl = await uploadProductImages(files)
  const parsedSizes = parseProductSizes(sizes)
  const stock = parsedSizes.reduce((stockData, size) => ({ ...stockData, [size]: 0 }), {})

  const productData = {
    name: productName,
    code: productCode,
    description,
    category,
    price: Number(price),
    subCategory: subcategory,
    material: parsedMaterials,
    color: parsedColors,
    newarrival: newarrival === 'true',
    sizes: parsedSizes,
    image: imagesUrl,
    date: Date.now()
  }

  const product = new productModel(productData)
  await product.save()

  await inventoryModel.create({ productId: product._id, stock })
  if (selectedCollectionId) await collectionModel.findByIdAndUpdate(selectedCollectionId, { $addToSet: { products: product._id } })

  return { success: true, message: "Product added successfully", product, imagesUrl }
}

const listProductsService = async (filters = emptyAdvancedFilters) => {
  const products = await productModel.find({}).lean()
  const inventories = await inventoryModel.find({ productId: { $in: products.map((item) => item._id) } }).lean()
  const inventoryByProduct = new Map(inventories.map((item) => [String(item.productId), item.stock || {}]))

  const productsWithStock = products.map((item) => ({
    ...item,
    stock: inventoryByProduct.get(String(item._id)) || {}
  }))

  return { success: true, products: filterProductsByAdvanced(productsWithStock, filters) }
}

const removeProductService = async (id) => {
  await collectionModel.updateMany({ products: id }, { $pull: { products: id } })
  await inventoryModel.findOneAndDelete({ productId: id })
  await productModel.findByIdAndDelete(id)
  return { success: true, message: "Product Removed" }
}

const singleProductService = async (productId) => {
  const product = await productModel.findById(productId)
  if (!product) return { success: false, message: 'Product not found' }

  const collection = await collectionModel.findOne({ products: product._id }).select('_id')
  return { success: true, product: { ...product.toObject(), collectionId: collection?._id || '' } }
}

const updateProductService = async (body, files) => {
  const { id, name, code, description, price, category, subcategory, material, color, collectionId, sizes, newarrival, oldImages } = body
  const productName = validateProductName(name)
  const productCode = validateProductCode(code)
  const selectedCollectionId = await validateProductCollection(collectionId)
  const parsedMaterials = parseProductOptions(material)
  const parsedColors = parseProductOptions(color)
  if (parsedMaterials.length === 0) throw new Error('Product material is required')
  if (parsedColors.length === 0) throw new Error('Product color is required')

  const product = await productModel.findById(id)
  if (!product) throw new Error('Product not found')
  await validateUniqueProductName(productName, id)
  await validateUniqueProductCode(productCode, id)

  const parsedOldImages = oldImages ? JSON.parse(oldImages) : product.image
  const finalImages = await uploadProductImages(files, parsedOldImages)
  const parsedSizes = parseProductSizes(sizes)

  const productData = {
    name: productName,
    code: productCode,
    description,
    category,
    price: Number(price),
    subCategory: subcategory,
    material: parsedMaterials,
    color: parsedColors,
    newarrival: newarrival === 'true',
    sizes: parsedSizes,
    image: finalImages
  }
  const updatedProduct = await productModel.findByIdAndUpdate(id, productData, { new: true, runValidators: true })

  await collectionModel.updateMany({ products: product._id }, { $pull: { products: product._id } })
  if (selectedCollectionId) await collectionModel.findByIdAndUpdate(selectedCollectionId, { $addToSet: { products: product._id } })

  const inventory = await inventoryModel.findOne({ productId: id })
  if (inventory) {
    const oldStock = inventory.stock || {}
    inventory.stock = parsedSizes.reduce((stockData, size) => ({ ...stockData, [size]: oldStock[size] || 0 }), {})
    await inventory.save()
  } else {
    const stock = parsedSizes.reduce((stockData, size) => ({ ...stockData, [size]: 0 }), {})
    await inventoryModel.create({ productId: id, stock })
  }

  return { success: true, message: "Product updated successfully", product: updatedProduct }
}

export { addProductService, listProductsService, removeProductService, singleProductService, updateProductService }
