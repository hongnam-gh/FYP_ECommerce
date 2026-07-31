import { v2 as cloudinary } from 'cloudinary'
import bannerModel from '../models/bannerModel.js'

// ------ Config --------

const bannerPages = ['home', 'new-arrivals-women', 'new-arrivals-men', 'new-arrivals-accessories', 'discover-fashion', 'collection-view-all', 'women-collection', 'men-collection', 'women-view-all', 'women-tops-shirts', 'women-bottomwear', 'women-outerwears', 'men-view-all', 'men-tops-shirts', 'men-bottomwear', 'men-outerwears', 'accessories-view-all', 'accessories-bags', 'accessories-boxers', 'accessories-hats', 'accessories-charms-stuff']

// ------ Business Helpers --------

const uploadBannerImage = async (file) => {
  if (!file) return ''

  const largeGif = file.mimetype === 'image/gif' && file.size > 10 * 1024 * 1024
  const result = await cloudinary.uploader.upload(file.path, { resource_type: largeGif ? 'video' : 'auto' })
  return result.secure_url
}

// ------ Public Services --------

const listBannersService = async () => {
  const banners = await bannerModel.find({}).sort({ date: 1 })
  return { success: true, banners }
}

const saveBannerService = async (body, file) => {
  const { page, eyebrow = '', title, subtitle = '' } = body
  if (!bannerPages.includes(page)) return { success: false, message: 'Banner page is invalid' }

  if (!title?.trim()) return { success: false, message: 'Banner title is required' }

  const currentBanner = await bannerModel.findOne({ page })
  const uploadedImage = await uploadBannerImage(file)
  const image = uploadedImage || currentBanner?.image
  if (!image) return { success: false, message: 'Banner image is required' }

  const banner = await bannerModel.findOneAndUpdate(
    { page },
    {
      page,
      image,
      eyebrow: eyebrow.trim(),
      title: title.trim(),
      subtitle: subtitle.trim(),
      date: Date.now()
    },
    { new: true, upsert: true, runValidators: true }
  )

  return { success: true, message: 'Banner saved successfully', banner }
}

const removeBannerService = async (page) => {
  const banner = await bannerModel.findOneAndDelete({ page })
  if (!banner) return { success: false, message: 'Banner not found' }
  return { success: true, message: 'Banner removed' }
}

export { listBannersService, removeBannerService, saveBannerService }
