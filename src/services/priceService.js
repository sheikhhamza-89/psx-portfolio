import { CORS_PROXIES, PSX_BASE_URL } from '../utils/constants'

/**
 * Fetches stock price and LDP from PSX website using CORS proxy
 * @param {string} symbol - Stock symbol (e.g., 'OGDC', 'HBL')
 * @returns {Promise<{price: number|null, ldp: number|null}>} The stock prices
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

        if (price !== null || ldp !== null) {
          console.log(`✅ Fetched ${normalizedSymbol} - Price: ${price}, LDP: ${ldp}`)
          return { price, ldp }
        }
      }
    } catch (error) {
      console.log(`❌ PSX fetch via proxy failed for ${normalizedSymbol}:`, error.message)
    }
  }

  return { price: null, ldp: null }
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
 * Fetches complete stock data including price and LDP
 * @param {string} symbol - Stock symbol
 * @returns {Promise<{price: number|null, ldp: number|null}>} Stock data
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
    ldp: psxData.ldp
  }
}
