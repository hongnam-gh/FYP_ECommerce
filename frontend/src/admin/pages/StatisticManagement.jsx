import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { FiActivity, FiAlertTriangle, FiBox, FiClock, FiDollarSign, FiHeart, FiPackage, FiShoppingBag, FiShoppingCart, FiTrendingDown, FiTrendingUp, FiUsers, FiXCircle } from 'react-icons/fi'
import { assets } from '../../assets/assets'
import { backendUrl, currency } from '../App'
import './StatisticManagement.css'

const formatNumber = (value) => new Intl.NumberFormat('en-US').format(Math.round(Number(value || 0)))
const formatMoney = (value) => `${currency}${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(Number(value || 0))}`
const getStatisticProductImage = (image) => {
  if (!image?.includes('/image/upload/')) return image
  return image.replace('/image/upload/', '/image/upload/c_pad,w_160,h_192,b_white,g_south/')
}
const formatChartDate = (value, showYear = false) => {
  const [year, month, day] = value.split('-')
  return showYear ? `${day}/${month}/${year}` : `${day}/${month}`
}
const SalesChart = ({ data }) => {
  const width = Math.max(900, (data.length * 36) + 82)
  const height = 280
  const padding = { top: 22, right: 20, bottom: 42, left: 62 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  const maxRevenue = Math.max(...data.map((item) => Number(item.revenue || 0)), 1)
  const points = data.map((item, index) => {
    const x = padding.left + (data.length === 1 ? chartWidth / 2 : (index / (data.length - 1)) * chartWidth)
    const y = padding.top + chartHeight - ((Number(item.revenue || 0) / maxRevenue) * chartHeight)
    return { ...item, x, y }
  })
  const linePoints = points.map((item) => `${item.x},${item.y}`).join(' ')
  const areaPath = points.length > 0 ? `M ${points[0].x} ${padding.top + chartHeight} L ${points.map((item) => `${item.x} ${item.y}`).join(' L ')} L ${points[points.length - 1].x} ${padding.top + chartHeight} Z` : ''
  const gridLines = Array.from({ length: 5 }, (_, index) => {
    const value = maxRevenue - ((maxRevenue / 4) * index)
    const y = padding.top + ((chartHeight / 4) * index)
    return { value, y }
  })

  return (
    <div className='statistics-chart-scroll'>
      <svg className='statistics-chart' style={{ minWidth: `${width}px` }} viewBox={`0 0 ${width} ${height}`} role='img' aria-label='Approved order sales by day'>
        <defs>
          <linearGradient id='statisticsArea' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='0%' stopColor='#111827' stopOpacity='.2' />
            <stop offset='100%' stopColor='#111827' stopOpacity='0' />
          </linearGradient>
        </defs>

        {gridLines.map((line, index) => (
          <g key={index}>
            <line x1={padding.left} y1={line.y} x2={width - padding.right} y2={line.y} stroke='#e5e7eb' strokeDasharray='4 6' />
            <text x={padding.left - 12} y={line.y + 4} textAnchor='end' fill='#9ca3af' fontSize='10'>{formatMoney(line.value)}</text>
          </g>
        ))}

        {areaPath && <path d={areaPath} fill='url(#statisticsArea)' />}
        {points.length > 0 && <polyline points={linePoints} fill='none' stroke='#111827' strokeWidth='3' strokeLinecap='round' strokeLinejoin='round' />}

        {points.map((point) => (
          <g className='statistics-chart-point' key={point.date}>
            <circle cx={point.x} cy={point.y} r='4' fill='#fff' stroke='#111827' strokeWidth='2'>
              <title>{`${formatChartDate(point.date, true)}: ${formatMoney(point.revenue)} · ${point.orders} orders · ${point.units} items`}</title>
            </circle>
            <g className='statistics-chart-tooltip' transform={`translate(${Math.min(Math.max(point.x, padding.left + 45), width - padding.right - 45)} ${Math.max(point.y - 34, 4)})`}>
              <rect x='-45' width='90' height='24' rx='5' fill='#6b7280' />
              <text y='15.5' textAnchor='middle' fill='#fff' fontSize='9' fontWeight='600'>{formatMoney(point.revenue)}</text>
            </g>
            <text x={point.x} y={height - 15} textAnchor='middle' fill='#9ca3af' fontSize='9'>{formatChartDate(point.date)}</text>
          </g>
        ))}
      </svg>
    </div>
  )
}

const Trend = ({ value }) => {
  if (value > 0) return <span className='statistics-trend up'><FiTrendingUp /> {value}%</span>
  if (value < 0) return <span className='statistics-trend down'><FiTrendingDown /> {Math.abs(value)}%</span>
  return <span className='statistics-trend neutral'>0%</span>
}

const StatisticManagement = ({ token }) => {
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState(30)

  const fetchStatistics = async () => {
    try {
      setLoading(true)
      const response = await axios.post(backendUrl + '/api/statistics/dashboard', {}, { headers: { token } })
      if (response.data.success) setStatistics(response.data)
      else toast.error(response.data.message)
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatistics()
  }, [token])

  const trendData = useMemo(() => statistics?.salesTrend?.slice(-range) || [], [statistics, range])

  if (loading) return <div className='statistics-loading'><span></span><p>Loading real store data...</p></div>
  if (!statistics) return <div className='statistics-loading'><p>Statistics are unavailable.</p><button type='button' onClick={fetchStatistics}>Try again</button></div>

  const { summary, comparison } = statistics
  const mainCards = [
    { label: 'Revenue', value: formatMoney(summary.grossSales), help: 'Paid online and delivered COD orders', icon: <FiDollarSign />, trend: comparison.revenueChange, background: assets.orange_gradient, tone: 'dark' },
    { label: 'Approved Orders', value: formatNumber(summary.approvedOrders), help: `${comparison.currentOrders} in the last 30 days`, icon: <FiShoppingBag />, trend: comparison.orderChange, background: assets.blue_gradient, tone: 'dark' },
    { label: 'Customers', value: formatNumber(summary.customers), help: 'Registered customer accounts', icon: <FiUsers />, background: assets.purple_gradient, tone: 'dark' },
    { label: 'Average Order', value: formatMoney(summary.averageOrderValue), help: `${formatNumber(summary.unitsSold)} items sold`, icon: <FiActivity />, background: assets.pink_gradient, tone: 'dark' }
  ]
  const operationCards = [
    { label: 'Products', value: summary.products, icon: <FiPackage /> },
    { label: 'Units in Stock', value: summary.totalStock, icon: <FiBox /> },
    { label: 'Pending Approval', value: summary.pendingOrders, icon: <FiClock /> },
    { label: 'Rejected Orders', value: summary.rejectedOrders, icon: <FiXCircle /> },
    { label: 'Low Stock', value: summary.lowStockProducts, icon: <FiAlertTriangle /> },
    { label: 'Out of Stock', value: summary.outOfStockProducts, icon: <FiAlertTriangle /> },
    { label: 'Wishlist Saves', value: summary.wishlistItems, icon: <FiHeart /> },
    { label: 'Active Carts', value: summary.activeCarts, icon: <FiShoppingCart /> }
  ]
  const maxStatus = Math.max(...statistics.orderStatuses.map((item) => item.value), 1)
  const maxCategory = Math.max(...statistics.categorySales.map((item) => item.revenue), 1)

  return (
    <div className='statistics-page'>
      <div className='statistics-header'>
        <div>
          <h1>Statistic Management</h1>
          <p>Live business data calculated from orders, customers, products, inventory, carts and wishlists.</p>
        </div>
        <div className='statistics-header-actions'>
          <span>Updated {new Date(statistics.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      <div className='statistics-main-cards'>
        {mainCards.map((card) => (
          <div className={`statistics-main-card statistics-main-card-${card.tone}`} style={{ backgroundImage: `url(${card.background})` }} key={card.label}>
            <div className='statistics-card-icon'>{card.icon}</div>
            <div className='statistics-card-label'><span>{card.label}</span>{card.trend !== undefined && <Trend value={card.trend} />}</div>
            <strong>{card.value}</strong>
            <small>{card.help}</small>
          </div>
        ))}
      </div>

      <div className='statistics-operation-cards'>
        {operationCards.map((card) => <div key={card.label}><span>{card.icon}</span><p>{card.label}<b>{formatNumber(card.value)}</b></p></div>)}
      </div>

      <div className='statistics-panel statistics-sales-panel'>
        <div className='statistics-panel-head'>
          <div>
            <h2>Sales Performance</h2>
            <p>Paid online and delivered COD revenue by day. Hover a point for exact values.</p>
          </div>
          <div className='statistics-range'>
            {[7, 14, 30].map((days) => <button key={days} type='button' onClick={() => setRange(days)} className={range === days ? 'active' : ''}>{days}D</button>)}
          </div>
        </div>
        <SalesChart data={trendData} />
      </div>

      <div className='statistics-two-columns'>
        <div className='statistics-panel'>
          <div className='statistics-panel-head statistics-panel-head-dark'><div><h2>Order Status</h2><p>Current workflow distribution</p></div></div>
          <div className='statistics-bars'>
            {statistics.orderStatuses.map((item) => (
              <div className='statistics-bar-row' key={item.name}>
                <div><span>{item.name}</span><b>{item.value}</b></div>
                <i><em style={{ width: `${(item.value / maxStatus) * 100}%` }}></em></i>
              </div>
            ))}
            {statistics.orderStatuses.length === 0 && <p className='statistics-empty'>No order data yet.</p>}
          </div>
        </div>

        <div className='statistics-panel'>
          <div className='statistics-panel-head statistics-panel-head-dark'><div><h2>Sales by Category</h2><p>Paid online and delivered COD product revenue</p></div></div>
          <div className='statistics-bars'>
            {statistics.categorySales.map((item) => (
              <div className='statistics-bar-row' key={item.name}>
                <div><span>{item.name}</span><b>{formatMoney(item.revenue)} · {item.units} items</b></div>
                <i><em style={{ width: `${(item.revenue / maxCategory) * 100}%` }}></em></i>
              </div>
            ))}
            {statistics.categorySales.length === 0 && <p className='statistics-empty'>No category sales yet.</p>}
          </div>
        </div>
      </div>

      <div className='statistics-panel'>
        <div className='statistics-panel-head statistics-panel-head-dark'><div><h2>Top Selling Products</h2><p>Ranked by actual approved units sold</p></div></div>
        <div className='statistics-product-table'>
          <div className='statistics-table-header'><span>Product</span><span>Code</span><span>Units</span><span>Product Revenue</span></div>
          {statistics.topProducts.map((item, index) => (
            <div className='statistics-product-row' key={item.productId}>
              <div className='statistics-product-name'><b>{index + 1}</b>{item.image ? <img src={getStatisticProductImage(item.image)} alt={item.name} /> : <span><FiPackage /></span>}<p>{item.name}</p></div>
              <span>{item.code || '—'}</span><strong>{item.units}</strong><strong>{formatMoney(item.revenue)}</strong>
            </div>
          ))}
          {statistics.topProducts.length === 0 && <p className='statistics-empty'>No product sales yet.</p>}
        </div>
      </div>

      <div className='statistics-two-columns'>
        <div className='statistics-panel'>
          <div className='statistics-panel-head statistics-panel-head-dark'><div><h2>Most Wishlisted</h2><p>Products customers saved most often</p></div></div>
          <div className='statistics-simple-list'>
            {statistics.topWishlist.map((item, index) => <div key={item.productId}><span className='rank'>{index + 1}</span><p>{item.name}</p><b>{item.count} saves</b></div>)}
            {statistics.topWishlist.length === 0 && <p className='statistics-empty'>No wishlist data yet.</p>}
          </div>
        </div>

        <div className='statistics-panel'>
          <div className='statistics-panel-head statistics-panel-head-dark'><div><h2>Recent Orders</h2><p>Latest activity across every approval state</p></div></div>
          <div className='statistics-recent-list'>
            {statistics.recentOrders.map((order) => <div key={order._id}><p>{order.customer}<small>{new Date(order.date).toLocaleDateString()} · {order.paymentMethod}</small></p><span>{order.status}</span><b>{formatMoney(order.amount)}</b></div>)}
            {statistics.recentOrders.length === 0 && <p className='statistics-empty'>No recent orders.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default StatisticManagement
