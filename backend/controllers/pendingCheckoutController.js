import { cancelPendingCheckoutService } from '../services/pendingCheckoutService.js'

const cancelPendingCheckout = async (req, res) => {
  try {
    res.json(await cancelPendingCheckoutService(req.body))
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

export { cancelPendingCheckout }
