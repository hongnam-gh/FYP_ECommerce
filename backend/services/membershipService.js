import membershipModel from '../models/membershipModel.js'
import orderModel from '../models/orderModel.js'
import waitForApproveModel from '../models/waitForApproveModel.js'
import rejectedOrderModel from '../models/rejectedOrderModel.js'
import productModel from '../models/productModel.js'

// ------ Config --------

const membershipPolicies = [
  { rank: 'Diamond', minSpent: 10000, discountPercent: 20, deliveryFee: 0 },
  { rank: 'Gold', minSpent: 5000, discountPercent: 10, deliveryFee: 0 },
  { rank: 'Silver', minSpent: 1000, discountPercent: 0, deliveryFee: 0 },
  { rank: 'Standard', minSpent: 0, discountPercent: 0, deliveryFee: 10 }
]

// ------ Database Helpers --------

const findMembership = (userId) => {
  return membershipModel.findOne({ userId }).select('rank')
}

const findOrders = (userId) => {
  return Promise.all([
    orderModel.find({ userId }).select('amount paymentMethod payment status').lean(),
    waitForApproveModel.find({ userId }).select('amount paymentMethod payment').lean(),
    rejectedOrderModel.countDocuments({ userId })
  ])
}

const findProducts = (productIds) => {
  return productModel.find({ _id: { $in: productIds } }).lean()
}

const updateMembership = (userId, policy, stats, calculatedAt, currentMembership) => {
  if (!currentMembership) {
    return membershipModel.findOneAndUpdate(
      { userId },
      {
        $set: { rank: policy.rank, totalSpent: stats.totalSpent, lastCalculatedAt: calculatedAt },
        $setOnInsert: { userId, rankHistory: [{ rank: policy.rank, date: calculatedAt }] }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )
  }

  const update = { $set: { rank: policy.rank, totalSpent: stats.totalSpent, lastCalculatedAt: calculatedAt } }
  if (currentMembership.rank !== policy.rank) update.$push = { rankHistory: { rank: policy.rank, date: calculatedAt } }

  return membershipModel.findOneAndUpdate({ userId }, update, { new: true })
}

// ------ Business Helpers --------

const roundMoney = (value) => Number(Number(value || 0).toFixed(2))

const calculateSpent = (orders, waitingOrders, rejectedOrders) => {
  const approvedSpent = orders.reduce((total, order) => {
    const isSpentOrder = order.paymentMethod !== 'COD' || order.status === 'Delivered'
    return isSpentOrder ? total + Number(order.amount || 0) : total
  }, 0)
  const waitingSpent = waitingOrders.reduce((total, order) => order.payment && order.paymentMethod !== 'COD' ? total + Number(order.amount || 0) : total, 0)

  return {
    totalSpent: roundMoney(approvedSpent + waitingSpent),
    totalOrders: orders.length + waitingOrders.length + rejectedOrders
  }
}

const getPolicy = (totalSpent) => {
  return membershipPolicies.find((policy) => totalSpent >= policy.minSpent) || membershipPolicies[membershipPolicies.length - 1]
}

const buildPricedItems = (items, products) => {
  const productMap = new Map(products.map((product) => [String(product._id), product]))
  const pricedItems = []

  for (const item of items || []) {
    const product = productMap.get(String(item._id || item.productId || ''))
    const quantity = Number(item.quantity || 0)
    if (!product || quantity <= 0) throw new Error('Invalid order product')
    pricedItems.push({ ...product, size: item.size, quantity })
  }

  return pricedItems
}

// ------ Public Services --------

const getMembershipPolicyService = (totalSpent) => {
  return getPolicy(totalSpent)
}

const calculateMembershipStatsService = async (userId) => {
  const [orders, waitingOrders, rejectedOrders] = await findOrders(userId)
  return calculateSpent(orders, waitingOrders, rejectedOrders)
}

const syncMembershipService = async (userId) => {
  const stats = await calculateMembershipStatsService(userId)
  const policy = getPolicy(stats.totalSpent)
  const currentMembership = await findMembership(userId)
  const calculatedAt = Date.now()
  await updateMembership(userId, policy, stats, calculatedAt, currentMembership)

  const currentIndex = membershipPolicies.findIndex((item) => item.rank === policy.rank)
  const nextPolicy = currentIndex > 0 ? membershipPolicies[currentIndex - 1] : null

  return {
    success: true,
    membership: {
      rank: policy.rank,
      totalSpent: stats.totalSpent,
      totalOrders: stats.totalOrders,
      discountPercent: policy.discountPercent,
      deliveryFee: policy.deliveryFee,
      nextRank: nextPolicy?.rank || '',
      remainingSpent: nextPolicy ? roundMoney(Math.max(nextPolicy.minSpent - stats.totalSpent, 0)) : 0
    }
  }
}

const calculateMemberOrderService = async (userId, items) => {
  const membershipResult = await syncMembershipService(userId)
  const membership = membershipResult.membership
  const productIds = [...new Set((items || []).map((item) => String(item._id || item.productId || '')).filter(Boolean))]
  const products = await findProducts(productIds)
  const pricedItems = buildPricedItems(items, products)

  const subtotal = roundMoney(pricedItems.reduce((total, item) => total + (Number(item.price || 0) * item.quantity), 0))
  const discountAmount = roundMoney(subtotal * membership.discountPercent / 100)
  const amount = roundMoney(subtotal - discountAmount + membership.deliveryFee)

  return {
    items: pricedItems,
    subtotal,
    membershipRank: membership.rank,
    discountPercent: membership.discountPercent,
    discountAmount,
    deliveryFee: membership.deliveryFee,
    amount
  }
}

export { getMembershipPolicyService, calculateMembershipStatsService, syncMembershipService, calculateMemberOrderService }
