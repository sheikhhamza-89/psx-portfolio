import { CORS_PROXIES, PSX_BASE_URL } from '../utils/constants'

/**
 * Fetches stock price from PSX website using CORS proxy
 * @param {string} symbol - Stock symbol (e.g., 'OGDC', 'HBL')
 * @returns {Promise<number|null>} The stock price or null if fetch fails
 */
export async function fetchPriceFromPSX(symbol) {
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

        // Extract Close Price using regex from PSX page
        const closeMatch = html.match(/quote__close[^>]*>\s*Rs\.?\s*([\d,]+\.?\d*)/)

        if (closeMatch) {
          const price = parseFloat(closeMatch[1].replace(/,/g, ''))
          if (price > 0) {
            console.log(`✅ Fetched ${normalizedSymbol} price from PSX: ${price}`)
            return price
          }
        }

        // Fallback: Try to extract LDCP (Last Day Closing Price)
        const ldcpMatch = html.match(/LDCP<\/div>\s*<div class="stats_value">([\d,\.]+)<\/div>/)
        if (ldcpMatch) {
          const ldcp = parseFloat(ldcpMatch[1].replace(/,/g, ''))
          if (ldcp > 0) {
            console.log(`✅ Fetched ${normalizedSymbol} LDCP from PSX: ${ldcp}`)
            return ldcp
          }
        }
      }
    } catch (error) {
      console.log(`❌ PSX fetch via proxy failed for ${normalizedSymbol}:`, error.message)
    }
  }

  return null
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

