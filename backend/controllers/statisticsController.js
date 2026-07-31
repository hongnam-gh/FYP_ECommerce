import { getStatisticsService } from '../services/statisticsService.js'

const getStatistics = async (req, res) => {
  try {
    res.json(await getStatisticsService())
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

export { getStatistics }
