import productModel from '../models/productModel.js'
import userModel from '../models/userModel.js'
import wishlistModel from '../models/wishlistModel.js'

// ------ Database Helpers --------

const getUserOrError = async (userId) => {
  if (!userId) return { error: { success: false, message: 'User not found' } }

  const userData = await userModel.findById(userId)
  if (!userData) return { error: { success: false, message: 'User not found' } }

  return { userData }
}

const getWishlistIds = async (userId) => {
  const wishlist = await wishlistModel.find({ userId }).sort({ date: -1 })
  return wishlist.map((item) => item.productId)
}

// ------ Public Services --------

const toggleWishlistService = async ({ userId, itemId }) => {
  const { error } = await getUserOrError(userId)
  if (error) return error

  const product = await productModel.findById(itemId)
  if (!product) return { success: false, message: 'Product not found' }

  const wishlistItem = await wishlistModel.findOne({ userId, productId: itemId })

  if (wishlistItem) {
    await wishlistModel.findOneAndDelete({ userId, productId: itemId })
    return { success: true, message: 'Removed From Wishlist', active: false, wishlistItems: await getWishlistIds(userId) }
  }

  await wishlistModel.create({
    userId,
    productId: itemId,
    name: product.name,
    price: product.price,
    category: product.category,
    subCategory: product.subCategory,
    date: Date.now()
  })

  return { success: true, message: 'Added To Wishlist', active: true, wishlistItems: await getWishlistIds(userId) }
}

const getUserWishlistService = async (userId) => {
  const { error } = await getUserOrError(userId)
  if (error) return error

  const wishlist = await wishlistModel.find({ userId }).sort({ date: -1 })
  const wishlistItems = wishlist.map((item) => item.productId)

  return { success: true, wishlist, wishlistItems }
}

export { toggleWishlistService, getUserWishlistService }
