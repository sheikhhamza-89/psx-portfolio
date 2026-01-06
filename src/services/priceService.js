import { CORS_PROXIES, PSX_BASE_URL } from '../utils/constants'

/**
 * Fetches stock price, LDP, 52-week high, daily low/high from PSX website using CORS proxy
 * @param {string} symbol - Stock symbol (e.g., 'OGDC', 'HBL')
 * @returns {Promise<{price: number|null, ldp: number|null, high52w: number|null, dayLow: number|null, dayHigh: number|null}>} The stock data
 */
export async function fetchPriceDataFromPSX(symbol) {
  const normalizedSymbol = symbol.toUpperCase().trim()
  const psxUrl = `${PSX_BASE_URL}${normalizedSymbol}`

  // Try each CORS proxy
  for (const proxy of CORS_PROXIES) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(proxy + encodeURIComponent(psxUrl), {
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const html = await response.text()
        let price = null
        let ldp = null
        let high52w = null
        let dayLow = null
        let dayHigh = null

        // Extract Close Price using regex from PSX page
        const closeMatch = html.match(/quote__close[^>]*>\s*Rs\.?\s*([\d,]+\.?\d*)/)
        if (closeMatch) {
          price = parseFloat(closeMatch[1].replace(/,/g, ''))
          if (price <= 0) price = null
        }

        // Extract LDCP (Last Day Closing Price)
        const ldcpMatch = html.match(/LDCP<\/div>\s*<div class="stats_value">([\d,\.]+)<\/div>/)
        if (ldcpMatch) {
          ldp = parseFloat(ldcpMatch[1].replace(/,/g, ''))
          if (ldp <= 0) ldp = null
        }

        // Extract 52 Week High
        const high52wMatch = html.match(/52\s*Week\s*High<\/div>\s*<div class="stats_value">([\d,\.]+)<\/div>/i)
        if (high52wMatch) {
          high52w = parseFloat(high52wMatch[1].replace(/,/g, ''))
          if (high52w <= 0) high52w = null
        }

        // Extract Day's Low
        const dayLowMatch = html.match(/Low<\/div>\s*<div class="stats_value">([\d,\.]+)<\/div>/)
        if (dayLowMatch) {
          dayLow = parseFloat(dayLowMatch[1].replace(/,/g, ''))
          if (dayLow <= 0) dayLow = null
        }

        // Extract Day's High
        const dayHighMatch = html.match(/High<\/div>\s*<div class="stats_value">([\d,\.]+)<\/div>/)
        if (dayHighMatch) {
          dayHigh = parseFloat(dayHighMatch[1].replace(/,/g, ''))
          if (dayHigh <= 0) dayHigh = null
        }

        if (price !== null || ldp !== null) {
          console.log(`✅ Fetched ${normalizedSymbol} - Price: ${price}, LDP: ${ldp}, 52wH: ${high52w}, Low: ${dayLow}, High: ${dayHigh}`)
          return { price, ldp, high52w, dayLow, dayHigh }
        }
      }
    } catch (error) {
      console.log(`❌ PSX fetch via proxy failed for ${normalizedSymbol}:`, error.message)
    }
  }

  return { price: null, ldp: null, high52w: null, dayLow: null, dayHigh: null }
}

/**
 * Fetches stock price from PSX website using CORS proxy
 * @param {string} symbol - Stock symbol (e.g., 'OGDC', 'HBL')
 * @returns {Promise<number|null>} The stock price or null if fetch fails
 */
export async function fetchPriceFromPSX(symbol) {
  const data = await fetchPriceDataFromPSX(symbol)
  return data.price || data.ldp
}

/**
 * Fetches stock price from Yahoo Finance as fallback
 * @param {string} symbol - Stock symbol
 * @returns {Promise<number|null>} The stock price or null if fetch fails
 */
export async function fetchPriceFromYahoo(symbol) {
  const normalizedSymbol = symbol.toUpperCase().trim()

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${normalizedSymbol}.KA`,
      {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      }
    )

    clearTimeout(timeoutId)

    if (response.ok) {
      const data = await response.json()
      if (data.chart?.result?.[0]?.meta?.regularMarketPrice) {
        const price = data.chart.result[0].meta.regularMarketPrice
        if (price > 0) {
          console.log(`✅ Fetched ${normalizedSymbol} price from Yahoo: ${price}`)
          return price
        }
      }
    }
  } catch (error) {
    console.log(`❌ Yahoo Finance fetch failed for ${normalizedSymbol}:`, error.message)
  }

  return null
}

/**
 * Fetches stock price from all available sources
 * @param {string} symbol - Stock symbol
 * @returns {Promise<number|null>} The stock price or null if all sources fail
 */
export async function fetchStockPrice(symbol) {
  // Try PSX first
  let price = await fetchPriceFromPSX(symbol)
  
  // Fallback to Yahoo Finance
  if (price === null) {
    price = await fetchPriceFromYahoo(symbol)
  }

  return price
}

/**
 * Fetches complete stock data including price, LDP, 52-week high, daily low/high
 * @param {string} symbol - Stock symbol
 * @returns {Promise<{price: number|null, ldp: number|null, high52w: number|null, dayLow: number|null, dayHigh: number|null}>} Stock data
 */
export async function fetchStockData(symbol) {
  // Try PSX first
  const psxData = await fetchPriceDataFromPSX(symbol)
  
  if (psxData.price !== null) {
    return psxData
  }

  // Fallback to Yahoo Finance for price only
  const yahooPrice = await fetchPriceFromYahoo(symbol)
  
  return {
    price: yahooPrice || psxData.ldp,
    ldp: psxData.ldp,
    high52w: psxData.high52w,
    dayLow: psxData.dayLow,
    dayHigh: psxData.dayHigh
  }
}
