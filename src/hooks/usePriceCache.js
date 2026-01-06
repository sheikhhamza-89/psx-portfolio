import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { PRICE_CACHE_KEY, CACHE_DURATION } from '../utils/constants'
import { fetchStockPrice } from '../services/priceService'

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
   * Set price in cache
   * @param {string} symbol - Stock symbol
   * @param {number} price - Price to cache
   */
  const setCachedPrice = useCallback((symbol, price) => {
    const normalizedSymbol = symbol.toUpperCase().trim()
    
    setCache(prev => ({
      ...prev,
      [normalizedSymbol]: {
        price,
        timestamp: Date.now()
      }
    }))
  }, [setCache])

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
    getCachedPrice,
    setCachedPrice,
    cleanCache
  }
}

