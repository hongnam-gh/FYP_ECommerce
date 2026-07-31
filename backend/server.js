import express from 'express'
import http from 'http'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import { Server } from 'socket.io'
import 'dotenv/config'
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import userRouter from './routes/userRoute.js'
import productRouter from './routes/productRoute.js'
import cartRouter from './routes/cartRoute.js'
import wishlistRouter from './routes/wishlistRoute.js'
import orderRouter from './routes/orderRoute.js'
import addressRouter from './routes/addressRoute.js'
import categoryRouter from './routes/categoryRoute.js'
import subCategoryRouter from './routes/subCategoryRoute.js'
import materialRouter from './routes/materialRoute.js'
import colorRouter from './routes/colorRoute.js'
import customerMessageRouter from './routes/customerMessageRoute.js'
import chatbotRouter from './routes/chatbotRoute.js'
import inventoryRouter from './routes/inventoryRoute.js'
import waitForApproveRouter from './routes/waitForApproveRoute.js'
import rejectedOrderRouter from './routes/rejectedOrderRoute.js'
import pendingCheckoutRouter from './routes/pendingCheckoutRoute.js'
import notificationRouter from './routes/notificationRoute.js'
import bannerRouter from './routes/bannerRoute.js'
import collectionRouter from './routes/collectionRoute.js'
import statisticsRouter from './routes/statisticsRoute.js'
import socialAuthRouter from './routes/socialAuthRoute.js'
import membershipRouter from './routes/membershipRoute.js'

// App Config
const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: '*'
  }
})

const port = process.env.PORT || 4000

connectDB()
connectCloudinary()

app.set('io', io)

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token

    if (!token) {
      return next(new Error('Not Authorize Login Again'))
    }

    socket.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch (error) {
    next(new Error('Not Authorize Login Again'))
  }
})

io.on('connection', (socket) => {
  if (socket.user.role === 'admin') {
    socket.join('admins')
  } else {
    socket.join(`user:${socket.user.id}`)
  }
})

// middlewares
app.use(express.json())
app.use(cors())

// api endpoints
app.use('/api/user', userRouter)
app.use('/api/product', productRouter)
app.use('/api/cart', cartRouter)
app.use('/api/wishlist', wishlistRouter)
app.use('/api/order', orderRouter)
app.use('/api/address', addressRouter)
app.use('/api/category', categoryRouter)
app.use('/api/sub-category', subCategoryRouter)
app.use('/api/material', materialRouter)
app.use('/api/color', colorRouter)
app.use('/api/customer-message', customerMessageRouter)
app.use('/api/chatbot', chatbotRouter)
app.use('/api/inventory', inventoryRouter)
app.use('/api/wait-for-approve', waitForApproveRouter)
app.use('/api/rejected-order', rejectedOrderRouter)
app.use('/api/pending-checkout', pendingCheckoutRouter)
app.use('/api/notification', notificationRouter)
app.use('/api/banner', bannerRouter)
app.use('/api/collection', collectionRouter)
app.use('/api/statistics', statisticsRouter)
app.use('/api/social-auth', socialAuthRouter)
app.use('/api/membership', membershipRouter)

app.get('/', (req, res) => {
  res.send('API Working')
})

server.listen(port, () => console.log('Server started on Port : ' + port))