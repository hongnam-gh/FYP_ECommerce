import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { FiActivity, FiAlertTriangle, FiBox, FiClock, FiDollarSign, FiHeart, FiPackage, FiShoppingBag, FiShoppingCart, FiTrendingDown, FiTrendingUp, FiUsers, FiXCircle } from 'react-icons/fi'
import { Chart as ChartJS, CategoryScale, Filler, LinearScale, LineElement, PointElement, Tooltip } from 'chart.js'
import { Line } from 'react-chartjs-2'
import { assets } from '../../assets/assets'
import { backendUrl, currency } from '../App'
import './StatisticManagement.css'

ChartJS.register(CategoryScale, Filler, LinearScale, LineElement, PointElement, Tooltip)

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
  const chartData = {
    labels: data.map((item) => formatChartDate(item.date)),
    datasets: [
      {
        label: 'Revenue',
        data: data.map((item) => Number(item.revenue || 0)),
        borderColor: '#111827',
        backgroundColor: 'rgba(17, 24, 39, .12)',
        pointBackgroundColor: '#fff',
        pointBorderColor: '#111827',
        pointBorderWidth: 2,
        pointHoverRadius: 6,
        pointRadius: 4,
        borderWidth: 3,
        fill: true,
        tension: .35
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      tooltip: {
        displayColors: false,
        callbacks: {
          title: (items) => {
            const item = data[items[0].dataIndex]
            return formatChartDate(item.date, true)
          },
          label: (item) => {
            const row = data[item.dataIndex]
            return `${formatMoney(row.revenue)} · ${row.orders} orders · ${row.units} items`
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#9ca3af', font: { size: 10 } }
      },
      y: {
        beginAtZero: true,
        grid: { color: '#e5e7eb', borderDash: [4, 6] },
        ticks: {
          color: '#9ca3af',
          font: { size: 10 },
          callback: (value) => formatMoney(value)
        }
      }
    }
  }

  return (
    <div className='statistics-chart-scroll'>
      <div className='statistics-chart'>
        <Line data={chartData} options={options} />
      </div>
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
