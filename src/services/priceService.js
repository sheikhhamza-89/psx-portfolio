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

        // Debug: Log sample HTML around stats section
        const statsSection = html.match(/stats_box[\s\S]{0,2000}/i)
        if (statsSection) {
          console.log(`📄 HTML sample for ${normalizedSymbol}:`, statsSection[0].substring(0, 500))
        }

        // Extract Close Price using regex from PSX page
        const closeMatch = html.match(/quote__close[^>]*>\s*Rs\.?\s*([\d,]+\.?\d*)/)
        if (closeMatch) {
          price = parseFloat(closeMatch[1].replace(/,/g, ''))
          if (price <= 0) price = null
        }

        // Extract LDCP (Last Day Closing Price) - try multiple patterns
        const ldcpPatterns = [
          /LDCP<\/div>\s*<div[^>]*class="[^"]*stats_value[^"]*"[^>]*>([\d,\.]+)<\/div>/i,
          /LDCP<\/div>\s*<div[^>]*>([\d,\.]+)<\/div>/i,
          /"LDCP"[^>]*>[\s\S]*?<[^>]*>([\d,\.]+)</i,
          /LDCP[\s\S]*?>([\d,\.]+)</i
        ]
        for (const pattern of ldcpPatterns) {
          const ldcpMatch = html.match(pattern)
          if (ldcpMatch) {
            ldp = parseFloat(ldcpMatch[1].replace(/,/g, ''))
            if (ldp > 0) {
              console.log(`🔍 LDCP matched with pattern: ${pattern}`)
              break
            }
          }
        }

        // Extract 52 Week High - try multiple patterns
        const high52wPatterns = [
          /52\s*[Ww]eek\s*[Hh]igh<\/div>\s*<div[^>]*class="[^"]*stats_value[^"]*"[^>]*>([\d,\.]+)<\/div>/i,
          /52\s*[Ww]eek\s*[Hh]igh<\/div>\s*<div[^>]*>([\d,\.]+)<\/div>/i,
          /52\s*-?\s*[Ww](?:eek)?\s*[Hh](?:igh)?<\/div>\s*<div[^>]*>([\d,\.]+)<\/div>/i
        ]
        for (const pattern of high52wPatterns) {
          const high52wMatch = html.match(pattern)
          if (high52wMatch && high52wMatch[1]) {
            const val = parseFloat(high52wMatch[1].replace(/,/g, ''))
            // Sanity check: 52w high should be reasonable (not millions for PSX stocks)
            if (val > 0 && val < 50000) {
              high52w = val
              console.log(`🔍 52W High matched with pattern: ${pattern}, value: ${val}`)
              break
            }
          }
        }

        // Extract Day's Low - try multiple patterns
        const dayLowPatterns = [
          /Low<\/div>\s*<div[^>]*class="[^"]*stats_value[^"]*"[^>]*>([\d,\.]+)<\/div>/i,
          /Low<\/div>\s*<div[^>]*>([\d,\.]+)<\/div>/i,
          /"Low"[\s\S]*?>([\d,\.]+)</i
        ]
        for (const pattern of dayLowPatterns) {
          const dayLowMatch = html.match(pattern)
          if (dayLowMatch) {
            dayLow = parseFloat(dayLowMatch[1].replace(/,/g, ''))
            if (dayLow > 0) {
              console.log(`🔍 Day Low matched with pattern: ${pattern}`)
              break
            }
          }
        }

        // Extract Day's High - try multiple patterns  
        const dayHighPatterns = [
          /High<\/div>\s*<div[^>]*class="[^"]*stats_value[^"]*"[^>]*>([\d,\.]+)<\/div>/i,
          /High<\/div>\s*<div[^>]*>([\d,\.]+)<\/div>/i,
          /"High"[\s\S]*?>([\d,\.]+)</i
        ]
        for (const pattern of dayHighPatterns) {
          const dayHighMatch = html.match(pattern)
          if (dayHighMatch) {
            dayHigh = parseFloat(dayHighMatch[1].replace(/,/g, ''))
            if (dayHigh > 0) {
              console.log(`🔍 Day High matched with pattern: ${pattern}`)
              break
            }
          }
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
