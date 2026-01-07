import { CORS_PROXIES, PSX_BASE_URL } from '../utils/constants'

/**
 * Fetches stock price, LDCP, 52-week high/low, daily low/high from PSX website using CORS proxy
 * @param {string} symbol - Stock symbol (e.g., 'OGDC', 'HBL')
 * @returns {Promise<{price: number|null, ldcp: number|null, high52w: number|null, low52w: number|null, dayLow: number|null, dayHigh: number|null}>} The stock data
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
        let ldcp = null
        let high52w = null
        let low52w = null
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
        // HTML structure: <div class="stats_item"><div class="stats_label">LDCP</div><div class="stats_value">254.92</div></div>
        const ldcpPatterns = [
          // Pattern for: <div class="stats_label">LDCP</div><div class="stats_value">254.92</div>
          /class="stats_label"[^>]*>LDCP<\/div>\s*<div[^>]*class="stats_value"[^>]*>([\d,\.]+)<\/div>/i,
          // Pattern for any label followed by value div
          />LDCP<\/div>\s*<div[^>]*>([\d,\.]+)<\/div>/i,
          // Fallback patterns
          /LDCP<\/div>\s*<div[^>]*class="[^"]*stats_value[^"]*"[^>]*>([\d,\.]+)<\/div>/i,
          /LDCP<\/div>\s*<div[^>]*>([\d,\.]+)<\/div>/i
        ]
        for (const pattern of ldcpPatterns) {
          const ldcpMatch = html.match(pattern)
          if (ldcpMatch) {
            ldcp = parseFloat(ldcpMatch[1].replace(/,/g, ''))
            if (ldcp > 0) {
              console.log(`🔍 LDCP matched with pattern: ${pattern}, value: ${ldcp}`)
              break
            }
          }
        }

        // Extract 52 Week High and Low from numRange data attributes
        // HTML: <div class="numRange" data-low="145.25" data-high="263.3" data-current="252.23">
        const numRangeMatch = html.match(/52-WEEK\s*RANGE[\s\S]*?numRange[^>]*data-low="([\d\.]+)"[^>]*data-high="([\d\.]+)"/i)
        if (numRangeMatch) {
          low52w = parseFloat(numRangeMatch[1])
          high52w = parseFloat(numRangeMatch[2])
          console.log(`🔍 52W Range: Low=${low52w}, High=${high52w}`)
        } else {
          // Fallback: try to find data-low and data-high directly (first occurrence should be 52w)
          const dataLowMatch = html.match(/data-low="([\d\.]+)"/i)
          const dataHighMatch = html.match(/data-high="([\d\.]+)"/i)
          if (dataLowMatch) {
            low52w = parseFloat(dataLowMatch[1])
          }
          if (dataHighMatch) {
            high52w = parseFloat(dataHighMatch[1])
          }
          if (low52w || high52w) {
            console.log(`🔍 52W Range from data attrs: Low=${low52w}, High=${high52w}`)
          }
        }

        // Extract Day's Low - try multiple patterns
        // HTML: <div class="stats_label">Low</div><div class="stats_value">253.00</div>
        const dayLowPatterns = [
          /class="stats_label"[^>]*>Low<\/div>\s*<div[^>]*class="stats_value"[^>]*>([\d,\.]+)<\/div>/i,
          />Low<\/div>\s*<div[^>]*>([\d,\.]+)<\/div>/i,
          /Low<\/div>\s*<div[^>]*class="[^"]*stats_value[^"]*"[^>]*>([\d,\.]+)<\/div>/i
        ]
        for (const pattern of dayLowPatterns) {
          const dayLowMatch = html.match(pattern)
          if (dayLowMatch) {
            dayLow = parseFloat(dayLowMatch[1].replace(/,/g, ''))
            if (dayLow > 0) {
              console.log(`🔍 Day Low matched, value: ${dayLow}`)
              break
            }
          }
        }

        // Extract Day's High - try multiple patterns  
        // HTML: <div class="stats_label">High</div><div class="stats_value">257.00</div>
        const dayHighPatterns = [
          /class="stats_label"[^>]*>High<\/div>\s*<div[^>]*class="stats_value"[^>]*>([\d,\.]+)<\/div>/i,
          />High<\/div>\s*<div[^>]*>([\d,\.]+)<\/div>/i,
          /High<\/div>\s*<div[^>]*class="[^"]*stats_value[^"]*"[^>]*>([\d,\.]+)<\/div>/i
        ]
        for (const pattern of dayHighPatterns) {
          const dayHighMatch = html.match(pattern)
          if (dayHighMatch) {
            dayHigh = parseFloat(dayHighMatch[1].replace(/,/g, ''))
            if (dayHigh > 0) {
              console.log(`🔍 Day High matched, value: ${dayHigh}`)
              break
            }
          }
        }

        if (price !== null || ldcp !== null) {
          console.log(`✅ Fetched ${normalizedSymbol} - Price: ${price}, LDCP: ${ldcp}, 52wH: ${high52w}, 52wL: ${low52w}, Low: ${dayLow}, High: ${dayHigh}`)
          return { price, ldcp, high52w, low52w, dayLow, dayHigh }
        }
      }
    } catch (error) {
      console.log(`❌ PSX fetch via proxy failed for ${normalizedSymbol}:`, error.message)
    }
  }

  return { price: null, ldcp: null, high52w: null, low52w: null, dayLow: null, dayHigh: null }
}

/**
 * Fetches stock price from PSX website using CORS proxy
 * @param {string} symbol - Stock symbol (e.g., 'OGDC', 'HBL')
 * @returns {Promise<number|null>} The stock price or null if fetch fails
 */
export async function fetchPriceFromPSX(symbol) {
  const data = await fetchPriceDataFromPSX(symbol)
  return data.price || data.ldcp
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
 * Fetches complete stock data including price, LDCP, 52-week high/low, daily low/high
 * @param {string} symbol - Stock symbol
 * @returns {Promise<{price: number|null, ldcp: number|null, high52w: number|null, low52w: number|null, dayLow: number|null, dayHigh: number|null}>} Stock data
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
    price: yahooPrice || psxData.ldcp,
    ldcp: psxData.ldcp,
    high52w: psxData.high52w,
    low52w: psxData.low52w,
    dayLow: psxData.dayLow,
    dayHigh: psxData.dayHigh
  }
}
