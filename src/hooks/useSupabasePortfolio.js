import { useState, useCallback, useEffect, useMemo } from 'react'
import { isSupabaseConfigured } from '../lib/supabase'
import * as supabaseService from '../services/supabaseService'
import { useLocalStorage } from './useLocalStorage'
import { usePriceCache } from './usePriceCache'
import { STORAGE_KEY } from '../utils/constants'

/**
 * Custom hook for managing portfolio state with Supabase
 * Falls back to localStorage if Supabase is not configured
 */
export function useSupabasePortfolio() {
  const [stocks, setStocksLocal] = useLocalStorage(STORAGE_KEY, [])
  const [supabaseStocks, setSupabaseStocks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [useSupabase, setUseSupabase] = useState(false)
  const { getPrice, getStockData } = usePriceCache()

  // Check if Supabase is configured and load data
  useEffect(() => {
    async function init() {
      if (isSupabaseConfigured()) {
        const data = await supabaseService.getStocks()
        if (data !== null) {
          setSupabaseStocks(data)
          setUseSupabase(true)
        }
      }
      setIsLoading(false)
    }
    init()
  }, [])

  // Get current stocks based on storage mode
  const currentStocks = useSupabase ? supabaseStocks : stocks
  const setStocks = useSupabase 
    ? setSupabaseStocks 
    : setStocksLocal

  /**
   * Reload stocks from Supabase
   */
  const reloadFromSupabase = useCallback(async () => {
    if (!useSupabase) return
    const data = await supabaseService.getStocks()
    if (data !== null) {
      setSupabaseStocks(data)
    }
  }, [useSupabase])

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

    if (useSupabase) {
      // Supabase mode
      const existingStock = supabaseStocks.find(s => s.symbol === symbol)
      
      if (existingStock) {
        // Calculate new totals
        const allTransactions = [...existingStock.transactions, {
          type: 'buy',
          shares: stockData.shares,
          price: stockData.purchasePrice
        }]
        const totalShares = allTransactions.reduce((sum, t) => 
          sum + (t.type === 'buy' ? t.shares : -t.shares), 0
        )
        const totalCost = allTransactions.reduce((sum, t) => 
          sum + (t.type === 'buy' ? t.shares * t.price : 0), 0
        )
        const avgPrice = totalShares > 0 ? totalCost / totalShares : 0

        await supabaseService.upsertStock({
          symbol,
          category: stockData.category || existingStock.category,
          shares: totalShares,
          purchasePrice: avgPrice,
          currentPrice
        })

        await supabaseService.addTransaction(existingStock.id, {
          type: 'buy',
          shares: stockData.shares,
          price: stockData.purchasePrice
        })

        onToast?.(`Added ${stockData.shares} shares to ${symbol}`, 'success')
      } else {
        const result = await supabaseService.upsertStock({
          symbol,
          category: stockData.category,
          shares: stockData.shares,
          purchasePrice: stockData.purchasePrice,
          currentPrice
        })

        if (result) {
          await supabaseService.addTransaction(result.id, {
            type: 'buy',
            shares: stockData.shares,
            price: stockData.purchasePrice
          })
        }

        onToast?.(`Added ${symbol} to portfolio`, 'success')
      }

      await reloadFromSupabase()
    } else {
      // localStorage mode
      const newTransaction = {
        id: Date.now().toString(),
        type: 'buy',
        shares: stockData.shares,
        price: stockData.purchasePrice,
        date: new Date().toISOString()
      }

      setStocksLocal(prev => {
        const existingIndex = prev.findIndex(s => s.symbol === symbol)
        
        if (existingIndex >= 0) {
          const existing = prev[existingIndex]
          const existingTransactions = existing.transactions || []
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
    }
  }, [useSupabase, supabaseStocks, getPrice, reloadFromSupabase, setStocksLocal])

  /**
   * Update an existing stock
   */
  const updateStock = useCallback(async (id, updates) => {
    if (useSupabase) {
      const stock = supabaseStocks.find(s => s.id === id)
      if (stock) {
        await supabaseService.upsertStock({
          symbol: stock.symbol,
          ...updates
        })
        await reloadFromSupabase()
      }
    } else {
      setStocksLocal(prev => prev.map(stock => 
        stock.id === id ? { ...stock, ...updates } : stock
      ))
    }
  }, [useSupabase, supabaseStocks, reloadFromSupabase, setStocksLocal])

  /**
   * Delete a stock
   */
  const deleteStock = useCallback(async (id, onToast) => {
    if (useSupabase) {
      const stock = supabaseStocks.find(s => s.id === id)
      const success = await supabaseService.deleteStock(id)
      if (success && stock) {
        onToast?.(`Removed ${stock.symbol}`, 'success')
        await reloadFromSupabase()
      }
    } else {
      setStocksLocal(prev => {
        const stock = prev.find(s => s.id === id)
        if (stock) {
          onToast?.(`Removed ${stock.symbol}`, 'success')
        }
        return prev.filter(s => s.id !== id)
      })
    }
  }, [useSupabase, supabaseStocks, reloadFromSupabase, setStocksLocal])

  /**
   * Sell shares
   */
  const sellStock = useCallback(async (sellData, onToast) => {
    const symbol = sellData.symbol.toUpperCase().trim()
    
    if (useSupabase) {
      const stock = supabaseStocks.find(s => s.symbol === symbol)
      if (!stock) {
        onToast?.(`Stock ${symbol} not found`, 'error')
        return
      }

      if (sellData.shares > stock.shares) {
        onToast?.(`Cannot sell more than ${stock.shares} shares`, 'error')
        return
      }

      const remainingShares = stock.shares - sellData.shares

      if (remainingShares <= 0) {
        await supabaseService.deleteStock(stock.id)
        onToast?.(`Sold all ${symbol} shares`, 'success')
      } else {
        await supabaseService.upsertStock({
          symbol,
          shares: remainingShares,
          purchasePrice: stock.purchasePrice,
          currentPrice: stock.currentPrice
        })
        await supabaseService.addTransaction(stock.id, {
          type: 'sell',
          shares: sellData.shares,
          price: sellData.price
        })
        onToast?.(`Sold ${sellData.shares} shares of ${symbol}`, 'success')
      }

      await reloadFromSupabase()
    } else {
      setStocksLocal(prev => {
        const stockIndex = prev.findIndex(s => s.symbol === symbol)
        if (stockIndex === -1) {
          onToast?.(`Stock ${symbol} not found`, 'error')
          return prev
        }

        const stock = prev[stockIndex]
        
        if (sellData.shares > stock.shares) {
          onToast?.(`Cannot sell more than ${stock.shares} shares`, 'error')
          return prev
        }

        const sellTransaction = {
          id: Date.now().toString(),
          type: 'sell',
          shares: sellData.shares,
          price: sellData.price,
          date: new Date().toISOString()
        }

        const allTransactions = [...(stock.transactions || []), sellTransaction]
        const remainingShares = stock.shares - sellData.shares

        if (remainingShares <= 0) {
          onToast?.(`Sold all ${symbol} shares`, 'success')
          return prev.filter(s => s.symbol !== symbol)
        }

        const updated = [...prev]
        updated[stockIndex] = {
          ...stock,
          shares: remainingShares,
          transactions: allTransactions
        }

        onToast?.(`Sold ${sellData.shares} shares of ${symbol}`, 'success')
        return updated
      })
    }
  }, [useSupabase, supabaseStocks, reloadFromSupabase, setStocksLocal])

  /**
   * Delete transaction
   */
  const deleteTransaction = useCallback(async (symbol, transactionId, onToast) => {
    if (useSupabase) {
      await supabaseService.deleteTransaction(transactionId)
      onToast?.(`Removed transaction from ${symbol}`, 'success')
      await reloadFromSupabase()
    } else {
      setStocksLocal(prev => {
        const stockIndex = prev.findIndex(s => s.symbol === symbol)
        if (stockIndex === -1) return prev

        const stock = prev[stockIndex]
        const newTransactions = (stock.transactions || []).filter(t => t.id !== transactionId)

        if (newTransactions.length === 0) {
          onToast?.(`Removed ${symbol} from portfolio`, 'success')
          return prev.filter(s => s.symbol !== symbol)
        }

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
    }
  }, [useSupabase, reloadFromSupabase, setStocksLocal])

  /**
   * Refresh prices
   */
  const refreshPrices = useCallback(async (onToast) => {
    if (currentStocks.length === 0) {
      onToast?.('No stocks to refresh', 'info')
      return
    }

    let updated = 0
    let failed = 0

    for (const stock of currentStocks) {
      const data = await getStockData(stock.symbol)
      
      if (data.price !== null) {
        if (useSupabase) {
          await supabaseService.updateStockPrices(stock.id, {
            currentPrice: data.price,
            ldp: data.ldp,
            high52w: data.high52w,
            dayLow: data.dayLow,
            dayHigh: data.dayHigh
          })
        }
        updated++
      } else {
        failed++
      }
    }

    if (useSupabase) {
      await reloadFromSupabase()
    } else {
      // Update localStorage stocks
      setStocksLocal(prev => prev.map(stock => {
        // Find the fetched data for this stock
        return stock // Will be updated in a separate pass
      }))

      // Re-fetch all prices and update
      const updatedStocks = [...stocks]
      for (let i = 0; i < updatedStocks.length; i++) {
        const data = await getStockData(updatedStocks[i].symbol)
        if (data.price !== null) {
          updatedStocks[i] = {
            ...updatedStocks[i],
            currentPrice: data.price,
            ldp: data.ldp || updatedStocks[i].ldp || data.price,
            high52w: data.high52w || updatedStocks[i].high52w || null,
            dayLow: data.dayLow || null,
            dayHigh: data.dayHigh || null
          }
        }
      }
      setStocksLocal(updatedStocks)
    }

    if (updated > 0 && failed === 0) {
      onToast?.(`Updated prices for ${updated} stock${updated > 1 ? 's' : ''}`, 'success')
    } else if (updated > 0 && failed > 0) {
      onToast?.(`Updated ${updated}, couldn't fetch ${failed} prices`, 'info')
    } else {
      onToast?.('Could not fetch prices. Try again later.', 'error')
    }
  }, [currentStocks, useSupabase, getStockData, reloadFromSupabase, setStocksLocal, stocks])

  /**
   * Calculate stats
   */
  const stats = useMemo(() => {
    let totalInvestment = 0
    let currentValue = 0

    currentStocks.forEach(stock => {
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
  }, [currentStocks])

  return {
    stocks: currentStocks,
    stats,
    isLoading,
    isUsingSupabase: useSupabase,
    addStock,
    sellStock,
    updateStock,
    deleteStock,
    deleteTransaction,
    refreshPrices,
    reloadFromSupabase
  }
}

