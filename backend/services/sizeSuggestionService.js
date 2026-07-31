// ------ Config --------

const SIZE_ORDER = ['S', 'M', 'L', 'XL']

const SIZE_CHART = {
  Women: [
    { size: 'S', minHeight: 150, maxHeight: 160, minWeight: 40, maxWeight: 48 },
    { size: 'M', minHeight: 155, maxHeight: 165, minWeight: 48, maxWeight: 56 },
    { size: 'L', minHeight: 160, maxHeight: 170, minWeight: 56, maxWeight: 64 },
    { size: 'XL', minHeight: 165, maxHeight: 175, minWeight: 64, maxWeight: 75 }
  ],
  Men: [
    { size: 'S', minHeight: 160, maxHeight: 170, minWeight: 50, maxWeight: 60 },
    { size: 'M', minHeight: 165, maxHeight: 175, minWeight: 60, maxWeight: 70 },
    { size: 'L', minHeight: 170, maxHeight: 180, minWeight: 70, maxWeight: 80 },
    { size: 'XL', minHeight: 175, maxHeight: 188, minWeight: 80, maxWeight: 92 }
  ]
}

// ------ Business Helpers --------

const getSizeByValue = (chart, value, type) => {
  const minKey = type === 'height' ? 'minHeight' : 'minWeight'
  const maxKey = type === 'height' ? 'maxHeight' : 'maxWeight'
  const matchedSize = chart.find((item) => value >= item[minKey] && value <= item[maxKey])

  if (matchedSize) return matchedSize.size
  if (value < chart[0][minKey]) return chart[0].size

  return chart[chart.length - 1].size
}

const getSizeIndex = (size) => {
  const sizeIndex = SIZE_ORDER.indexOf(size)

  return sizeIndex >= 0 ? sizeIndex : 1
}

const getBaseSizeIndex = (heightIndex, weightIndex) => {
  if (weightIndex > heightIndex) return weightIndex
  if (heightIndex - weightIndex >= 2) return heightIndex - 1

  return Math.max(heightIndex, weightIndex)
}

const applyFitSize = (baseIndex, heightIndex, weightIndex, fit) => {
  if (fit === 'slim') {
    if (weightIndex > heightIndex) return baseIndex

    return Math.max(0, baseIndex - 1)
  }

  if (fit === 'oversized') return Math.min(SIZE_ORDER.length - 1, baseIndex + 1)

  return baseIndex
}

const getAvailableSize = (suggestedIndex, availableSizes) => {
  const suggestedSize = SIZE_ORDER[suggestedIndex]
  if (!availableSizes || availableSizes.length === 0 || availableSizes.includes(suggestedSize)) return suggestedSize

  const matchedSizes = SIZE_ORDER
    .map((item, index) => ({ size: item, index }))
    .filter((item) => availableSizes.includes(item.size))
    .sort((a, b) => Math.abs(a.index - suggestedIndex) - Math.abs(b.index - suggestedIndex))

  return matchedSizes[0]?.size || suggestedSize
}

const getMeasurements = (text) => {
  const heightMatches = [...text.matchAll(/(\d{3})\s*(?:cm|centimeters?|centimetres?)/gi)]
  const weightMatches = [...text.matchAll(/(\d{2,3})\s*(?:kg|kilograms?|kilogrammes?)/gi)]
  const height = Number(heightMatches[heightMatches.length - 1]?.[1])
  const weight = Number(weightMatches[weightMatches.length - 1]?.[1])
  if (!height || !weight) return null

  return { height, weight }
}

const getSelectedFit = (text) => {
  if (/oversized|oversize/i.test(text)) return 'oversized'
  if (/slim|body/i.test(text)) return 'slim'
  if (/regular/i.test(text)) return 'regular'

  return ''
}

// ------ Public Services --------

const getSizeRecommendation = (text, product = {}, previousMessages = []) => {
  let measurements = getMeasurements(text)
  let measurementText = text
  const fit = getSelectedFit(text)

  if (!measurements) {
    const previousMeasurementText = previousMessages
      .filter((message) => message.sender === 'customer')
      .map((message) => message.text)
      .join(' ')
    const previousMeasurements = getMeasurements(previousMeasurementText)

    if (previousMeasurements) {
      measurements = previousMeasurements
      measurementText = previousMeasurementText
    }
  }

  if (measurements && !fit) {
    return 'Would you like Slim Fit, Regular Fit, or Oversized Fit?'
  }

  if (!measurements || !fit) return null

  const { height, weight } = measurements

  const isWomen = product.category === 'Women' || /(^|\s)(women|woman|female)(\s|$)/i.test(measurementText)
  const category = isWomen ? 'Women' : 'Men'
  const chart = SIZE_CHART[category]
  const heightIndex = getSizeIndex(getSizeByValue(chart, height, 'height'))
  const weightIndex = getSizeIndex(getSizeByValue(chart, weight, 'weight'))
  const baseIndex = getBaseSizeIndex(heightIndex, weightIndex)
  const sizeIndex = applyFitSize(baseIndex, heightIndex, weightIndex, fit)
  const size = getAvailableSize(sizeIndex, product.sizes)
  const fitLabel = fit === 'slim' ? 'Slim Fit' : fit === 'oversized' ? 'Oversized Fit' : 'Regular Fit'
  const productName = typeof product.name === 'string' ? product.name.trim().slice(0, 120) : ''

  return `${productName ? 'For ' + productName + ', ' : ''}${height}cm / ${weight}kg is best suited to size ${size} (${fitLabel}). To be certain, please contact Admin Support.`
}

export { getSizeRecommendation }
