import jwt from 'jsonwebtoken'
import adminModel from '../models/adminModel.js'

const adminAuth = async (req ,res, next) => {
    try {
        const {token} = req.headers
        if (!token) {
            return res.json({success:false, message:"Not Authorize Login Again"})
        }
        const token_decode = jwt.verify(token,process.env.JWT_SECRET);
        if (!token_decode.id || token_decode.role !== 'admin') {
            return res.json({success:false, message:"Not Authorize Login Again"})
        }

        const admin = await adminModel.findById(token_decode.id)
        if (!admin) {
            return res.json({success:false, message:"Not Authorize Login Again"})
        }
        req.adminId = admin._id.toString()
        req.adminName = admin.name
        next()
    } catch (error) {
        res.json({ success: false, message: error.message });   
    }
}

export default adminAuth
