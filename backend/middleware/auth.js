import jwt from 'jsonwebtoken'
import userModel from '../models/userModel.js'

const authUser = async (req, res, next) => {

    const { token } = req.headers;

    if (!token) {
        return res.json({ success: false, message: 'Not Athorzied Login Again' })
    }

    try {

        const token_decode = jwt.verify(token, process.env.JWT_SECRET)

        const user = await userModel.findById(token_decode.id).select('_id')
        if (!user) return res.json({ success: false, message: 'User account is disabled' })

        req.userId = token_decode.id
        if (req.body) req.body.userId = token_decode.id

        next()

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }

}

export default authUser
