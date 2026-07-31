import { syncMembershipService } from '../services/membershipService.js'

const getUserMembership = async (req, res) => {
  try {
    res.json(await syncMembershipService(req.body.userId))
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

export { getUserMembership }
