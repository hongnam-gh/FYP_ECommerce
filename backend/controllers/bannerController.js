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
    const result = await saveBannerService(req.body, req.file)

    if (result.success) {
      req.app.get('io').emit('banner:update', {
        banner: result.banner
      })
    }
    res.json(result)
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const removeBanner = async (req, res) => {
  try {
    const result = await removeBannerService(req.body.page)

    if (result.success) {
      req.app.get('io').emit('banner:remove', {
        page: result.page
      })
    }

    res.json(result)
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}
export { listBanners, removeBanner, saveBanner }