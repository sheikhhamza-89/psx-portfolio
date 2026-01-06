import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { PRICE_CACHE_KEY, CACHE_DURATION } from '../utils/constants'
import { fetchStockPrice, fetchStockData } from '../services/priceService'

/**
 * Custom hook for managing price cache with localStorage persistence
 */
export function usePriceCache() {
  const [cache, setCache] = useLocalStorage(PRICE_CACHE_KEY, {})

  /**
   * Get cached price if still valid
   * @param {string} symbol - Stock symbol
   * @returns {number|null} Cached price or null if expired/not found
   */
  const getCachedPrice = useCallback((symbol) => {
    const normalizedSymbol = symbol.toUpperCase().trim()
    const cached = cache[normalizedSymbol]
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.price
    }
    
    return null
  }, [cache])

  /**
   * Get cached data if still valid
   * @param {string} symbol - Stock symbol
   * @returns {{price: number|null, ldp: number|null, high52w: number|null, dayLow: number|null, dayHigh: number|null}|null} Cached data or null
   */
  const getCachedData = useCallback((symbol) => {
    const normalizedSymbol = symbol.toUpperCase().trim()
    const cached = cache[normalizedSymbol]
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return { 
        price: cached.price, 
        ldp: cached.ldp,
        high52w: cached.high52w || null,
        dayLow: cached.dayLow || null,
        dayHigh: cached.dayHigh || null
      }
    }
    
    return null
  }, [cache])

  /**
   * Set stock data in cache
   * @param {string} symbol - Stock symbol
   * @param {object} data - Stock data to cache
   */
  const setCachedData = useCallback((symbol, data) => {
    const normalizedSymbol = symbol.toUpperCase().trim()
    
    setCache(prev => ({
      ...prev,
      [normalizedSymbol]: {
        price: data.price,
        ldp: data.ldp,
        high52w: data.high52w,
        dayLow: data.dayLow,
        dayHigh: data.dayHigh,
        timestamp: Date.now()
      }
    }))
  }, [setCache])

  /**
   * Set price in cache (legacy support)
   * @param {string} symbol - Stock symbol
   * @param {number} price - Price to cache
   * @param {number} ldp - LDP to cache (optional)
   */
  const setCachedPrice = useCallback((symbol, price, ldp = null) => {
    setCachedData(symbol, { price, ldp, high52w: null, dayLow: null, dayHigh: null })
  }, [setCachedData])

  /**
   * Fetch price with caching
   * @param {string} symbol - Stock symbol
   * @returns {Promise<number|null>} Stock price
   */
  const getPrice = useCallback(async (symbol) => {
    // Check cache first
    const cachedPrice = getCachedPrice(symbol)
    if (cachedPrice !== null) {
      console.log(`📦 Using cached price for ${symbol}: ${cachedPrice}`)
      return cachedPrice
    }

    // Fetch from API
    const price = await fetchStockPrice(symbol)
    
    if (price !== null) {
      setCachedPrice(symbol, price)
    }
    
    return price
  }, [getCachedPrice, setCachedPrice])

  /**
   * Fetch complete stock data with caching
   * @param {string} symbol - Stock symbol
   * @returns {Promise<{price: number|null, ldp: number|null, high52w: number|null, dayLow: number|null, dayHigh: number|null}>} Stock data
   */
  const getStockData = useCallback(async (symbol) => {
    // Check cache first
    const cachedData = getCachedData(symbol)
    if (cachedData !== null && cachedData.price !== null) {
      console.log(`📦 Using cached data for ${symbol}: Price=${cachedData.price}, LDP=${cachedData.ldp}, 52wH=${cachedData.high52w}`)
      return cachedData
    }

    // Fetch from API
    const data = await fetchStockData(symbol)
    
    if (data.price !== null) {
      setCachedData(symbol, data)
    }
    
    return data
  }, [getCachedData, setCachedData])

  /**
   * Clear expired entries from cache
   */
  const cleanCache = useCallback(() => {
    const now = Date.now()
    setCache(prev => {
      const cleaned = { ...prev }
      Object.keys(cleaned).forEach(symbol => {
        if (now - cleaned[symbol].timestamp > CACHE_DURATION) {
          delete cleaned[symbol]
        }
      })
      return cleaned
    })
  }, [setCache])

  return {
    getPrice,
    getStockData,
    getCachedPrice,
    getCachedData,
    setCachedPrice,
    cleanCache
  }
}
