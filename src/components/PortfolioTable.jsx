import { useState, useMemo } from 'react'
import { formatNumber, formatCurrency, formatPercent } from '../utils/formatters'
import { STOCK_CATEGORIES } from '../utils/constants'

export function PortfolioTable({ stocks, onEdit, onDelete, onRefresh, isRefreshing, onSymbolClick }) {
  const [symbolFilter, setSymbolFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  // Get unique symbols for dropdown
  const uniqueSymbols = useMemo(() => {
    return [...new Set(stocks.map(s => s.symbol))].sort()
  }, [stocks])

  // Get unique categories that exist in portfolio
  const usedCategories = useMemo(() => {
    const catValues = [...new Set(stocks.map(s => s.category).filter(Boolean))]
    return STOCK_CATEGORIES.filter(cat => catValues.includes(cat.value))
  }, [stocks])

  // Filter stocks based on selected filters
  const filteredStocks = useMemo(() => {
    return stocks.filter(stock => {
      const matchesSymbol = !symbolFilter || stock.symbol === symbolFilter
      const matchesCategory = !categoryFilter || stock.category === categoryFilter
      return matchesSymbol && matchesCategory
    })
  }, [stocks, symbolFilter, categoryFilter])

  // Get category label from value
  const getCategoryLabel = (value) => {
    const cat = STOCK_CATEGORIES.find(c => c.value === value)
    return cat ? cat.label : value || '—'
  }

  const clearFilters = () => {
    setSymbolFilter('')
    setCategoryFilter('')
  }

  const hasActiveFilters = symbolFilter || categoryFilter

  if (stocks.length === 0) {
    return (
      <section className="portfolio-section">
        <div className="section-header">
          <h2 className="section-title">
            <span className="title-icon">◇</span>
            My Portfolio
          </h2>
        </div>
        
        <div className="empty-state visible">
          <span className="empty-icon">📊</span>
          <p>No stocks in your portfolio yet</p>
          <span className="empty-hint">Add your first stock above to get started</span>
        </div>
      </section>
    )
  }

  return (
    <section className="portfolio-section">
      <div className="section-header">
        <h2 className="section-title">
          <span className="title-icon">◇</span>
          My Portfolio
        </h2>
        <button 
          className={`btn btn-refresh ${isRefreshing ? 'loading' : ''}`}
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh all prices"
        >
          <span className="refresh-icon">↻</span>
          Refresh Prices
        </button>
      </div>

      {/* Filter Section */}
      <div className="filter-section">
        <div className="filter-group">
          <label htmlFor="symbol-filter">Filter by Symbol</label>
          <select
            id="symbol-filter"
            value={symbolFilter}
            onChange={(e) => setSymbolFilter(e.target.value)}
          >
            <option value="">All Symbols</option>
            {uniqueSymbols.map(symbol => (
              <option key={symbol} value={symbol}>{symbol}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="category-filter">Filter by Category</label>
          <select
            id="category-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {usedCategories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <button className="btn btn-clear-filter" onClick={clearFilters}>
            ✕ Clear Filters
          </button>
        )}

        <div className="filter-info">
          Showing {filteredStocks.length} of {stocks.length} positions
        </div>
      </div>

      <div className="table-container">
        <table className="portfolio-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Category</th>
              <th>Shares</th>
              <th>Avg. Cost</th>
              <th>Today's Price</th>
              <th>Investment</th>
              <th>Current Value</th>
              <th>P&L</th>
              <th>P&L %</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStocks.map(stock => {
              const investment = stock.shares * stock.purchasePrice
              const currentValue = stock.shares * (stock.currentPrice || stock.purchasePrice)
              const pnl = currentValue - investment
              const pnlPercent = ((pnl / investment) * 100).toFixed(2)
              const isPositive = pnl >= 0

              return (
                <tr key={stock.id}>
                  <td className="symbol">
                    <button 
                      className="symbol-link"
                      onClick={() => onSymbolClick?.(stock)}
                      title="View transaction history"
                    >
                      {stock.symbol}
                    </button>
                  </td>
                  <td className="category">
                    <span className={`category-badge ${stock.category || 'other'}`}>
                      {getCategoryLabel(stock.category)}
                    </span>
                  </td>
                  <td className="shares">{formatNumber(stock.shares)}</td>
                  <td className="price">{formatCurrency(stock.purchasePrice)}</td>
                  <td className="current-price">
                    {formatCurrency(stock.currentPrice || stock.purchasePrice)}
                  </td>
                  <td className="value">{formatCurrency(investment)}</td>
                  <td className="value">{formatCurrency(currentValue)}</td>
                  <td className={`pnl ${isPositive ? 'positive' : 'negative'}`}>
                    {isPositive ? '▲' : '▼'} PKR {formatNumber(Math.abs(pnl))}
                  </td>
                  <td>
                    <span className={`pnl-percent ${isPositive ? 'positive' : 'negative'}`}>
                      {formatPercent(pnlPercent)}
                    </span>
                  </td>
                  <td className="actions">
                    <button 
                      className="action-btn edit" 
                      onClick={() => onEdit(stock)}
                      title="Edit"
                    >
                      ✎
                    </button>
                    <button 
                      className="action-btn delete" 
                      onClick={() => onDelete(stock.id)}
                      title="Delete"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
