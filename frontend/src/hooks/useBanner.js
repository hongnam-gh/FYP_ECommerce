import { useEffect, useState } from 'react'
import axios from 'axios'
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

  return banner
}

export default useBanner
