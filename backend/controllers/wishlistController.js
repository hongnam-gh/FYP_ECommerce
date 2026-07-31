import { toggleWishlistService, getUserWishlistService } from '../services/wishlistService.js'

const toggleWishlist = async (req, res) => {
  try {
    res.json(await toggleWishlistService(req.body))
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const getUserWishlist = async (req, res) => {
  try {
    res.json(await getUserWishlistService(req.body.userId))
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

export { toggleWishlist, getUserWishlist }
