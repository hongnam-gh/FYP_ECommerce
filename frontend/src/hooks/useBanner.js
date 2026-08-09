import { useEffect, useState } from 'react'
import axios from 'axios'
import { io } from 'socket.io-client'
import { backendUrl } from '../constants/shopConfig'

const useBanner = (page) => {
  const [banner, setBanner] = useState(null)

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const response = await axios.get(backendUrl + '/api/banner/list')
        if (response.data.success) setBanner(response.data.banners.find((item) => item.page === page) || null)
      } catch (error) {
        console.log(error)
      }
    }

    fetchBanner()
  }, [page])

  useEffect(() => {
    const socket = io(backendUrl)

    const updateBanner = ({ banner }) => {
      if (banner?.page !== page) return
      setBanner(banner)
    }

    const removeBanner = ({ page: removedPage }) => {
      if (removedPage !== page) return
      setBanner(null)
    }

    socket.on('banner:update', updateBanner)
    socket.on('banner:remove', removeBanner)

    return () => {
      socket.off('banner:update', updateBanner)
      socket.off('banner:remove', removeBanner)
      socket.disconnect()
    }
  }, [page])

  return banner
}

export default useBanner
