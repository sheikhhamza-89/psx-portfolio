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
   * Add a new stock to portfolio (with transaction history)
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

    // Create new transaction
    const newTransaction = {
      id: Date.now().toString(),
      type: 'buy',
      shares: stockData.shares,
      price: stockData.purchasePrice,
      date: new Date().toISOString()
    }

    setStocks(prev => {
      const existingIndex = prev.findIndex(s => s.symbol === symbol)
      
      if (existingIndex >= 0) {
        // Add to existing position with transaction history
        const existing = prev[existingIndex]
        const existingTransactions = existing.transactions || []
        
        // Calculate new totals from all transactions
        const allTransactions = [...existingTransactions, newTransaction]
        const totalShares = allTransactions.reduce((sum, t) => 
          sum + (t.type === 'buy' ? t.shares : -t.shares), 0
        )
        const totalCost = allTransactions.reduce((sum, t) => 
          sum + (t.type === 'buy' ? t.shares * t.price : 0), 0
        )
        const avgPrice = totalShares > 0 ? totalCost / totalShares : 0
        
        const updated = [...prev]
        updated[existingIndex] = {
          ...existing,
          category: stockData.category || existing.category,
          shares: totalShares,
          purchasePrice: parseFloat(avgPrice.toFixed(2)),
          currentPrice: currentPrice,
          transactions: allTransactions
        }
        
        onToast?.(`Added ${stockData.shares} shares to ${symbol}`, 'success')
        return updated
      }
      
      // New stock entry
      const newStock = {
        id: Date.now().toString(),
        symbol,
        category: stockData.category,
        shares: stockData.shares,
        purchasePrice: stockData.purchasePrice,
        currentPrice,
        addedAt: new Date().toISOString(),
        transactions: [newTransaction]
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
   * Sell shares of a stock
   */
  const sellStock = useCallback(async (sellData, onToast) => {
    const symbol = sellData.symbol.toUpperCase().trim()
    
    setStocks(prev => {
      const stockIndex = prev.findIndex(s => s.symbol === symbol)
      if (stockIndex === -1) {
        onToast?.(`Stock ${symbol} not found in portfolio`, 'error')
        return prev
      }

      const stock = prev[stockIndex]
      
      if (sellData.shares > stock.shares) {
        onToast?.(`Cannot sell more than ${stock.shares} shares`, 'error')
        return prev
      }

      // Create sell transaction
      const sellTransaction = {
        id: Date.now().toString(),
        type: 'sell',
        shares: sellData.shares,
        price: sellData.price,
        date: new Date().toISOString()
      }

      const existingTransactions = stock.transactions || []
      const allTransactions = [...existingTransactions, sellTransaction]

      // Calculate new totals
      const remainingShares = stock.shares - sellData.shares

      // If all shares sold, remove the stock
      if (remainingShares <= 0) {
        onToast?.(`Sold all ${symbol} shares`, 'success')
        return prev.filter(s => s.symbol !== symbol)
      }

      // Update stock with remaining shares
      const updated = [...prev]
      updated[stockIndex] = {
        ...stock,
        shares: remainingShares,
        transactions: allTransactions
      }

      onToast?.(`Sold ${sellData.shares} shares of ${symbol}`, 'success')
      return updated
    })
  }, [setStocks])

  /**
   * Delete a specific transaction from a stock
   */
  const deleteTransaction = useCallback((symbol, transactionId, onToast) => {
    setStocks(prev => {
      const stockIndex = prev.findIndex(s => s.symbol === symbol)
      if (stockIndex === -1) return prev

      const stock = prev[stockIndex]
      const transactions = stock.transactions || []
      const newTransactions = transactions.filter(t => t.id !== transactionId)

      // If no transactions left, remove the stock entirely
      if (newTransactions.length === 0) {
        onToast?.(`Removed ${symbol} from portfolio`, 'success')
        return prev.filter(s => s.symbol !== symbol)
      }

      // Recalculate totals
      const totalShares = newTransactions.reduce((sum, t) => 
        sum + (t.type === 'buy' ? t.shares : -t.shares), 0
      )
      const totalCost = newTransactions.reduce((sum, t) => 
        sum + (t.type === 'buy' ? t.shares * t.price : 0), 0
      )
      const avgPrice = totalShares > 0 ? totalCost / totalShares : 0

      const updated = [...prev]
      updated[stockIndex] = {
        ...stock,
        shares: totalShares,
        purchasePrice: parseFloat(avgPrice.toFixed(2)),
        transactions: newTransactions
      }

      onToast?.(`Removed transaction from ${symbol}`, 'success')
      return updated
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
    sellStock,
    updateStock,
    deleteStock,
    deleteTransaction,
    refreshPrices
  }
}
