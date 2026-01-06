import { useCallback, useMemo } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { usePriceCache } from './usePriceCache'
import { STORAGE_KEY } from '../utils/constants'

/**
 * Custom hook for managing portfolio state
 */
export function usePortfolio() {
  const [stocks, setStocks] = useLocalStorage(STORAGE_KEY, [])
  const { getPrice } = usePriceCache()

  /**
   * Add a new stock to portfolio
   */
  const addStock = useCallback(async (stockData, onToast) => {
    const symbol = stockData.symbol.toUpperCase().trim()
    let currentPrice = stockData.currentPrice

    // Try to fetch current price if not provided
    if (!currentPrice) {
      onToast?.(`Fetching price for ${symbol}...`, 'info')
      currentPrice = await getPrice(symbol)
      
      if (!currentPrice) {
        currentPrice = stockData.purchasePrice
        onToast?.(`Could not fetch price for ${symbol}. Using purchase price.`, 'info')
      }
    }

    const newStock = {
      id: Date.now().toString(),
      symbol,
      category: stockData.category,
      shares: stockData.shares,
      purchasePrice: stockData.purchasePrice,
      currentPrice,
      addedAt: new Date().toISOString()
    }

    setStocks(prev => {
      const existingIndex = prev.findIndex(s => s.symbol === symbol)
      
      if (existingIndex >= 0) {
        // Average the position
        const existing = prev[existingIndex]
        const totalShares = existing.shares + newStock.shares
        const totalCost = (existing.shares * existing.purchasePrice) + (newStock.shares * newStock.purchasePrice)
        
        const updated = [...prev]
        updated[existingIndex] = {
          ...existing,
          category: newStock.category || existing.category,
          shares: totalShares,
          purchasePrice: parseFloat((totalCost / totalShares).toFixed(2)),
          currentPrice: newStock.currentPrice
        }
        
        onToast?.(`Averaged position in ${symbol}`, 'success')
        return updated
      }
      
      onToast?.(`Added ${symbol} to portfolio`, 'success')
      return [...prev, newStock]
    })
  }, [getPrice, setStocks])

  /**
   * Update an existing stock
   */
  const updateStock = useCallback((id, updates) => {
    setStocks(prev => prev.map(stock => 
      stock.id === id ? { ...stock, ...updates } : stock
    ))
  }, [setStocks])

  /**
   * Delete a stock from portfolio
   */
  const deleteStock = useCallback((id, onToast) => {
    setStocks(prev => {
      const stock = prev.find(s => s.id === id)
      if (stock) {
        onToast?.(`Removed ${stock.symbol}`, 'success')
      }
      return prev.filter(s => s.id !== id)
    })
  }, [setStocks])

  /**
   * Refresh all stock prices
   */
  const refreshPrices = useCallback(async (onToast) => {
    if (stocks.length === 0) {
      onToast?.('No stocks to refresh', 'info')
      return
    }

    let updated = 0
    let failed = 0
    const updatedStocks = [...stocks]

    for (let i = 0; i < updatedStocks.length; i++) {
      const stock = updatedStocks[i]
      const price = await getPrice(stock.symbol)
      
      if (price !== null) {
        updatedStocks[i] = { ...stock, currentPrice: price }
        updated++
      } else {
        failed++
      }
    }

    setStocks(updatedStocks)

    if (updated > 0 && failed === 0) {
      onToast?.(`Updated prices for ${updated} stock${updated > 1 ? 's' : ''}`, 'success')
    } else if (updated > 0 && failed > 0) {
      onToast?.(`Updated ${updated}, couldn't fetch ${failed} prices`, 'info')
    } else {
      onToast?.('Could not fetch prices. Enter manually or try again later.', 'error')
    }
  }, [stocks, getPrice, setStocks])

  /**
   * Calculate portfolio statistics
   */
  const stats = useMemo(() => {
    let totalInvestment = 0
    let currentValue = 0

    stocks.forEach(stock => {
      totalInvestment += stock.shares * stock.purchasePrice
      currentValue += stock.shares * (stock.currentPrice || stock.purchasePrice)
    })

    const totalPnl = currentValue - totalInvestment
    const totalPnlPercent = totalInvestment > 0 
      ? ((totalPnl / totalInvestment) * 100).toFixed(2) 
      : 0

    return {
      totalInvestment,
      currentValue,
      totalPnl,
      totalPnlPercent,
      isPositive: totalPnl >= 0
    }
  }, [stocks])

  return {
    stocks,
    stats,
    addStock,
    updateStock,
    deleteStock,
    refreshPrices
  }
}

