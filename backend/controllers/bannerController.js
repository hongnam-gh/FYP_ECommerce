import { listBannersService, removeBannerService, saveBannerService } from '../services/bannerService.js'

const listBanners = async (req, res) => {
  try {
    res.json(await listBannersService())
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const saveBanner = async (req, res) => {
  try {
    res.json(await saveBannerService(req.body, req.file))
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const removeBanner = async (req, res) => {
  try {
    res.json(await removeBannerService(req.body.page))
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

export { listBanners, removeBanner, saveBanner }
