import orderModel from '../models/orderModel.js'
import waitForApproveModel from '../models/waitForApproveModel.js'
import rejectedOrderModel from '../models/rejectedOrderModel.js'
import userModel from '../models/userModel.js'
import productModel from '../models/productModel.js'
import inventoryModel from '../models/inventoryModel.js'
import wishlistModel from '../models/wishlistModel.js'
import cartModel from '../models/cartModel.js'

// ------ Business Helpers --------

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
const dateKey = (value) => {
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const percentageChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0
  return Number((((current - previous) / previous) * 100).toFixed(1))
}

// ------ Public Services --------

const getStatisticsService = async () => {
  const [orders, waitingOrders, rejectedOrders, customers, products, inventories, wishlistItems, cartItems] = await Promise.all([
    orderModel.find({}).lean(),
    waitForApproveModel.find({}).lean(),
    rejectedOrderModel.find({}).lean(),
    userModel.countDocuments({}),
    productModel.find({}).lean(),
    inventoryModel.find({}).lean(),
    wishlistModel.find({}).lean(),
    cartModel.find({}).lean()
  ])

  const productMap = new Map(products.map((product) => [String(product._id), product]))
  const now = new Date()
  const today = startOfDay(now)
  const currentStart = today - (29 * 24 * 60 * 60 * 1000)
  const previousStart = currentStart - (30 * 24 * 60 * 60 * 1000)
  const previousEnd = currentStart

  const salesTrend = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(currentStart + (index * 24 * 60 * 60 * 1000))
    return { date: dateKey(date), revenue: 0, orders: 0, units: 0 }
  })
  const trendMap = new Map(salesTrend.map((item) => [item.date, item]))

  let grossSales = 0
  let deliveredSales = 0
  let unitsSold = 0
  let revenueOrders = 0
  let currentRevenue = 0
  let previousRevenue = 0
  let currentOrders = 0
  let previousOrders = 0
  const productSales = new Map()
  const categorySales = new Map()
  const paymentMethods = new Map()
  const orderStatuses = new Map()

  orders.forEach((order) => {
    const amount = Number(order.amount || 0)
    const orderDate = Number(order.date || 0)
    const isRevenueOrder = order.paymentMethod !== 'COD' || order.status === 'Delivered'

    if (isRevenueOrder) {
      grossSales += amount
      revenueOrders += 1
    }
    if (order.status === 'Delivered') deliveredSales += amount
    paymentMethods.set(order.paymentMethod || 'Unknown', (paymentMethods.get(order.paymentMethod || 'Unknown') || 0) + 1)
    orderStatuses.set(order.status || 'Order Placed', (orderStatuses.get(order.status || 'Order Placed') || 0) + 1)

    if (orderDate >= currentStart) {
      currentOrders += 1
      if (isRevenueOrder) currentRevenue += amount
    } else if (orderDate >= previousStart && orderDate < previousEnd) {
      previousOrders += 1
      if (isRevenueOrder) previousRevenue += amount
    }

    const trendItem = trendMap.get(dateKey(orderDate))
    if (trendItem) {
      if (isRevenueOrder) trendItem.revenue += amount
      trendItem.orders += 1
    }

    ;(order.items || []).forEach((item) => {
      const quantity = Number(item.quantity || 0)
      const price = Number(item.price || 0)
      const productId = String(item._id || item.productId || item.name)
      const category = item.category || 'Uncategorized'
      unitsSold += quantity
      if (trendItem) trendItem.units += quantity

      const productData = productSales.get(productId) || { productId, name: item.name || 'Unknown product', code: item.code || '', image: item.image?.[0] || '', units: 0, revenue: 0 }
      productData.units += quantity
      if (isRevenueOrder) productData.revenue += price * quantity
      productSales.set(productId, productData)

      const categoryData = categorySales.get(category) || { name: category, units: 0, revenue: 0 }
      categoryData.units += quantity
      if (isRevenueOrder) categoryData.revenue += price * quantity
      categorySales.set(category, categoryData)
    })
  })

  orderStatuses.set('Wait For Approve', waitingOrders.length)
  orderStatuses.set('Rejected', rejectedOrders.length)

  const inventoryRows = inventories.map((inventory) => {
    const product = productMap.get(String(inventory.productId))
    const sizeStock = Object.values(inventory.stock || {}).map((value) => Number(value || 0))
    const totalStock = sizeStock.reduce((total, value) => total + value, 0)
    return { productId: String(inventory.productId), name: product?.name || 'Unknown product', code: product?.code || '', image: product?.image?.[0] || '', totalStock, stock: inventory.stock || {} }
  })

  const wishlistMap = new Map()
  wishlistItems.forEach((item) => {
    const productId = String(item.productId)
    const current = wishlistMap.get(productId) || { productId, name: item.name || productMap.get(productId)?.name || 'Unknown product', count: 0 }
    current.count += 1
    wishlistMap.set(productId, current)
  })

  const recentOrders = [
    ...orders.map((order) => ({ ...order, approvalStatus: 'Approved' })),
    ...waitingOrders.map((order) => ({ ...order, approvalStatus: 'Waiting' })),
    ...rejectedOrders.map((order) => ({ ...order, approvalStatus: 'Rejected' }))
  ].sort((a, b) => Number(b.date || 0) - Number(a.date || 0)).slice(0, 8).map((order) => ({
    _id: order._id,
    customer: `${order.address?.firstName || ''} ${order.address?.lastName || ''}`.trim() || order.address?.email || 'Customer',
    amount: Number(order.amount || 0),
    paymentMethod: order.paymentMethod,
    status: order.approvalStatus === 'Approved' ? order.status : order.approvalStatus,
    date: order.date
  }))

  const totalStock = inventoryRows.reduce((total, item) => total + item.totalStock, 0)
  const lowStockItems = inventoryRows.filter((item) => item.totalStock > 0 && item.totalStock <= 5).sort((a, b) => a.totalStock - b.totalStock)
  const outOfStockItems = inventoryRows.filter((item) => item.totalStock === 0)
  const cartUsers = new Set(cartItems.map((item) => item.userId)).size
  const cartUnits = cartItems.reduce((total, item) => total + Number(item.quantity || 0), 0)

  return {
    success: true,
    generatedAt: Date.now(),
    summary: {
      grossSales,
      deliveredSales,
      approvedOrders: orders.length,
      pendingOrders: waitingOrders.length,
      rejectedOrders: rejectedOrders.length,
      customers,
      products: products.length,
      unitsSold,
      averageOrderValue: revenueOrders > 0 ? grossSales / revenueOrders : 0,
      paidOrders: orders.filter((order) => order.payment).length,
      totalStock,
      lowStockProducts: lowStockItems.length,
      outOfStockProducts: outOfStockItems.length,
      wishlistItems: wishlistItems.length,
      activeCarts: cartUsers,
      cartUnits
    },
    comparison: {
      revenueChange: percentageChange(currentRevenue, previousRevenue),
      orderChange: percentageChange(currentOrders, previousOrders),
      currentRevenue,
      previousRevenue,
      currentOrders,
      previousOrders
    },
    salesTrend,
    orderStatuses: [...orderStatuses.entries()].map(([name, value]) => ({ name, value })),
    paymentMethods: [...paymentMethods.entries()].map(([name, value]) => ({ name, value })),
    categorySales: [...categorySales.values()].sort((a, b) => b.revenue - a.revenue),
    topProducts: [...productSales.values()].sort((a, b) => b.units - a.units).slice(0, 8),
    inventoryAlerts: [...outOfStockItems, ...lowStockItems].slice(0, 8),
    topWishlist: [...wishlistMap.values()].sort((a, b) => b.count - a.count).slice(0, 6),
    recentOrders
  }
}

export { getStatisticsService }
