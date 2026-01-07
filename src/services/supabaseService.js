import { supabase, isSupabaseConfigured } from '../lib/supabase'

/**
 * Supabase service for portfolio data operations
 * Falls back to null if Supabase is not configured
 */

// ============================================================================
// STOCKS OPERATIONS
// ============================================================================

/**
 * Get a single stock by symbol
 */
export async function getStockBySymbol(symbol) {
  if (!isSupabaseConfigured()) return null

  const { data: userData } = await supabase.auth.getUser()
  const userId = userData?.user?.id || null

  let query = supabase
    .from('stocks')
    .select(`*, transactions (*)`)
    .eq('symbol', symbol.toUpperCase())

  if (userId) {
    query = query.eq('user_id', userId)
  } else {
    query = query.is('user_id', null)
  }

  const { data, error } = await query.maybeSingle()

  if (error || !data) return null

  return {
    id: data.id,
    symbol: data.symbol,
    category: data.category,
    shares: parseFloat(data.shares),
    purchasePrice: parseFloat(data.purchase_price),
    currentPrice: data.current_price ? parseFloat(data.current_price) : null,
    transactions: (data.transactions || []).map(tx => ({
      id: tx.id,
      type: tx.type,
      shares: parseFloat(tx.shares),
      price: parseFloat(tx.price),
      date: tx.date
    }))
  }
}

/**
 * Get all stocks for the current user
 */
export async function getStocks() {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('stocks')
    .select(`
      *,
      transactions (*)
    `)
    .order('added_at', { ascending: false })

  if (error) {
    console.error('Error fetching stocks:', error)
    return null
  }

  // Transform to match local storage format
  // Filter out stocks with 0 shares (those are closed positions)
  return data
    .filter(stock => parseFloat(stock.shares) > 0)
    .map(stock => ({
      id: stock.id,
      symbol: stock.symbol,
      category: stock.category,
      shares: parseFloat(stock.shares),
      purchasePrice: parseFloat(stock.purchase_price),
      currentPrice: stock.current_price ? parseFloat(stock.current_price) : null,
      ldcp: stock.ldp ? parseFloat(stock.ldp) : null,
      high52w: stock.high_52w ? parseFloat(stock.high_52w) : null,
      dayLow: stock.day_low ? parseFloat(stock.day_low) : null,
      dayHigh: stock.day_high ? parseFloat(stock.day_high) : null,
      addedAt: stock.added_at,
      transactions: (stock.transactions || []).map(tx => ({
        id: tx.id,
        type: tx.type,
        shares: parseFloat(tx.shares),
        price: parseFloat(tx.price),
        date: tx.date
      }))
    }))
}

/**
 * Add or update a stock
 */
export async function upsertStock(stockData) {
  if (!isSupabaseConfigured()) return null

  const { data: userData } = await supabase.auth.getUser()
  const userId = userData?.user?.id || null

  // Check if stock exists (by symbol only, since we may not have user auth)
  let query = supabase
    .from('stocks')
    .select('id, shares, purchase_price')
    .eq('symbol', stockData.symbol.toUpperCase())
  
  // Only filter by user_id if we have one
  if (userId) {
    query = query.eq('user_id', userId)
  } else {
    query = query.is('user_id', null)
  }

  const { data: existing } = await query.maybeSingle()

  if (existing) {
    // Update existing stock
    const { data, error } = await supabase
      .from('stocks')
      .update({
        category: stockData.category,
        shares: stockData.shares,
        purchase_price: stockData.purchasePrice,
        current_price: stockData.currentPrice,
        ldp: stockData.ldcp,
        high_52w: stockData.high52w,
        day_low: stockData.dayLow,
        day_high: stockData.dayHigh
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating stock:', error)
      return null
    }
    return { ...data, isNew: false, existingId: existing.id }
  } else {
    // Insert new stock
    const { data, error } = await supabase
      .from('stocks')
      .insert({
        symbol: stockData.symbol.toUpperCase(),
        category: stockData.category,
        shares: stockData.shares,
        purchase_price: stockData.purchasePrice,
        current_price: stockData.currentPrice,
        ldp: stockData.ldcp,
        high_52w: stockData.high52w,
        day_low: stockData.dayLow,
        day_high: stockData.dayHigh,
        user_id: userId
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting stock:', error)
      return null
    }
    return { ...data, isNew: true }
  }
}

/**
 * Update stock prices
 */
export async function updateStockPrices(stockId, priceData) {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('stocks')
    .update({
      current_price: priceData.currentPrice,
      ldp: priceData.ldcp,
      high_52w: priceData.high52w,
      day_low: priceData.dayLow,
      day_high: priceData.dayHigh
    })
    .eq('id', stockId)
    .select()
    .single()

  if (error) {
    console.error('Error updating stock prices:', error)
    return null
  }
  return data
}

/**
 * Delete a stock
 */
export async function deleteStock(stockId) {
  if (!isSupabaseConfigured()) return false

  const { error } = await supabase
    .from('stocks')
    .delete()
    .eq('id', stockId)

  if (error) {
    console.error('Error deleting stock:', error)
    return false
  }
  return true
}

// ============================================================================
// TRANSACTIONS OPERATIONS
// ============================================================================

/**
 * Add a transaction
 */
export async function addTransaction(stockId, transactionData) {
  if (!isSupabaseConfigured()) return null

  const { data: userData } = await supabase.auth.getUser()
  const userId = userData?.user?.id

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      stock_id: stockId,
      type: transactionData.type,
      shares: transactionData.shares,
      price: transactionData.price,
      date: transactionData.date || new Date().toISOString(),
      user_id: userId
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding transaction:', error)
    return null
  }
  return data
}

/**
 * Delete a transaction
 */
export async function deleteTransaction(transactionId) {
  if (!isSupabaseConfigured()) return false

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transactionId)

  if (error) {
    console.error('Error deleting transaction:', error)
    return false
  }
  return true
}

// ============================================================================
// PRICE CACHE OPERATIONS
// ============================================================================

/**
 * Get cached price for a symbol
 */
export async function getCachedPrice(symbol) {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('price_cache')
    .select('*')
    .eq('symbol', symbol.toUpperCase())
    .single()

  if (error || !data) return null

  // Check if cache is still valid (15 minutes)
  const cachedAt = new Date(data.cached_at)
  const now = new Date()
  const diffMinutes = (now - cachedAt) / (1000 * 60)

  if (diffMinutes > 15) {
    return null // Cache expired
  }

  return {
    price: data.price ? parseFloat(data.price) : null,
    ldcp: data.ldp ? parseFloat(data.ldp) : null,
    high52w: data.high_52w ? parseFloat(data.high_52w) : null,
    dayLow: data.day_low ? parseFloat(data.day_low) : null,
    dayHigh: data.day_high ? parseFloat(data.day_high) : null
  }
}

/**
 * Set cached price for a symbol
 */
export async function setCachedPrice(symbol, priceData) {
  if (!isSupabaseConfigured()) return false

  const { error } = await supabase
    .from('price_cache')
    .upsert({
      symbol: symbol.toUpperCase(),
      price: priceData.price,
      ldp: priceData.ldcp,
      high_52w: priceData.high52w,
      day_low: priceData.dayLow,
      day_high: priceData.dayHigh,
      cached_at: new Date().toISOString()
    }, {
      onConflict: 'symbol'
    })

  if (error) {
    console.error('Error caching price:', error)
    return false
  }
  return true
}

// ============================================================================
// DIVIDENDS OPERATIONS
// ============================================================================

/**
 * Get all dividends
 */
export async function getDividends() {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('dividends')
    .select('*')
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching dividends:', error)
    return null
  }

  return data.map(div => ({
    id: div.id,
    stockId: div.stock_id,
    symbol: div.symbol,
    amount: parseFloat(div.amount),
    date: div.date,
    notes: div.notes
  }))
}

/**
 * Get dividends for a specific symbol
 */
export async function getDividendsBySymbol(symbol) {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('dividends')
    .select('*')
    .eq('symbol', symbol.toUpperCase())
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching dividends for symbol:', error)
    return null
  }

  return data.map(div => ({
    id: div.id,
    stockId: div.stock_id,
    symbol: div.symbol,
    amount: parseFloat(div.amount),
    date: div.date,
    notes: div.notes
  }))
}

/**
 * Add a dividend
 */
export async function addDividend(dividendData) {
  if (!isSupabaseConfigured()) return null

  const { data: userData } = await supabase.auth.getUser()
  const userId = userData?.user?.id || null

  const { data, error } = await supabase
    .from('dividends')
    .insert({
      stock_id: dividendData.stockId,
      symbol: dividendData.symbol.toUpperCase(),
      amount: dividendData.amount,
      date: dividendData.date || new Date().toISOString(),
      notes: dividendData.notes || null,
      user_id: userId
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding dividend:', error)
    return null
  }

  return {
    id: data.id,
    stockId: data.stock_id,
    symbol: data.symbol,
    amount: parseFloat(data.amount),
    date: data.date,
    notes: data.notes
  }
}

/**
 * Delete a dividend
 */
export async function deleteDividend(dividendId) {
  if (!isSupabaseConfigured()) return false

  const { error } = await supabase
    .from('dividends')
    .delete()
    .eq('id', dividendId)

  if (error) {
    console.error('Error deleting dividend:', error)
    return false
  }
  return true
}

/**
 * Get total dividends for a symbol
 */
export async function getTotalDividendsBySymbol(symbol) {
  if (!isSupabaseConfigured()) return 0

  const { data, error } = await supabase
    .from('dividends')
    .select('amount')
    .eq('symbol', symbol.toUpperCase())

  if (error || !data) return 0

  return data.reduce((sum, div) => sum + parseFloat(div.amount), 0)
}

// ============================================================================
// CLOSED POSITIONS
// ============================================================================

/**
 * Get closed positions (stocks that have been fully sold)
 * Looks for stocks with 0 shares OR where transaction history shows all shares sold
 */
export async function getClosedPositions() {
  if (!isSupabaseConfigured()) return null

  // Get all stocks (including those with 0 shares)
  const { data: stocks, error: stocksError } = await supabase
    .from('stocks')
    .select('id, symbol, shares, category')

  if (stocksError || !stocks) {
    console.error('Error fetching stocks:', stocksError)
    return null
  }

  // Get all transactions
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: true })

  if (error || !transactions) {
    console.error('Error fetching transactions:', error)
    return null
  }

  // Create a map of stock_id to stock data
  const stockIdToData = {}
  stocks.forEach(s => {
    stockIdToData[s.id] = s
  })

  // Group transactions by symbol
  const bySymbol = {}
  
  transactions.forEach(tx => {
    const stockData = stockIdToData[tx.stock_id]
    if (!stockData) return
    const symbol = stockData.symbol

    if (!bySymbol[symbol]) {
      bySymbol[symbol] = {
        symbol,
        category: stockData.category,
        currentShares: stockData.shares,
        buyTransactions: [],
        sellTransactions: [],
        totalSharesBought: 0,
        totalSharesSold: 0,
        totalBoughtAmount: 0,
        totalSoldAmount: 0
      }
    }

    const shares = parseFloat(tx.shares)
    const price = parseFloat(tx.price)

    if (tx.type === 'buy') {
      bySymbol[symbol].buyTransactions.push(tx)
      bySymbol[symbol].totalSharesBought += shares
      bySymbol[symbol].totalBoughtAmount += shares * price
    } else if (tx.type === 'sell') {
      bySymbol[symbol].sellTransactions.push(tx)
      bySymbol[symbol].totalSharesSold += shares
      bySymbol[symbol].totalSoldAmount += shares * price
    }
  })

  // Filter to only closed positions:
  // 1. Stocks with 0 current shares, OR
  // 2. Stocks where shares bought = shares sold (transaction-based detection)
  const closedPositions = Object.values(bySymbol)
    .filter(p => {
      // Must have sold something
      if (p.totalSharesSold === 0) return false
      
      // Check if current shares is 0 OR if buy/sell transactions balance out
      const isClosed = p.currentShares === 0 || 
                       Math.abs(p.totalSharesBought - p.totalSharesSold) < 0.0001
      return isClosed
    })
    .map(p => {
      const avgBuyPrice = p.totalBoughtAmount / p.totalSharesBought
      const avgSellPrice = p.totalSoldAmount / p.totalSharesSold
      const realizedPnl = p.totalSoldAmount - p.totalBoughtAmount
      const pnlPercent = p.totalBoughtAmount > 0 
        ? (realizedPnl / p.totalBoughtAmount) * 100 
        : 0

      return {
        symbol: p.symbol,
        category: p.category,
        totalSharesBought: p.totalSharesBought,
        totalSharesSold: p.totalSharesSold,
        avgBuyPrice,
        avgSellPrice,
        totalBoughtAmount: p.totalBoughtAmount,
        totalSoldAmount: p.totalSoldAmount,
        realizedPnl,
        pnlPercent,
        buyTransactions: p.buyTransactions,
        sellTransactions: p.sellTransactions
      }
    })
    .sort((a, b) => b.realizedPnl - a.realizedPnl) // Sort by P&L descending

  return closedPositions
}

// ============================================================================
// UTILITY
// ============================================================================

/**
 * Check if user is authenticated
 */
export async function getCurrentUser() {
  if (!isSupabaseConfigured()) return null

  const { data } = await supabase.auth.getUser()
  return data?.user || null
}

/**
 * Sign out
 */
export async function signOut() {
  if (!isSupabaseConfigured()) return

  await supabase.auth.signOut()
}

