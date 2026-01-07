import { useState, useEffect, useMemo } from 'react'
import { formatCurrency } from '../utils/formatters'
import * as supabaseService from '../services/supabaseService'
import { isSupabaseConfigured } from '../lib/supabase'
import { DividendDetailModal } from './DividendDetailModal'

export function DividendsTab({ stocks, onDividendChange }) {
  const [dividends, setDividends] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState({
    symbol: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedSymbol, setSelectedSymbol] = useState(null)

  // Load dividends from Supabase
  useEffect(() => {
    async function loadDividends() {
      if (isSupabaseConfigured()) {
        const data = await supabaseService.getDividends()
        if (data) {
          setDividends(data)
        }
      }
      setIsLoading(false)
    }
    loadDividends()
  }, [])

  // Group dividends by symbol
  const dividendsBySymbol = useMemo(() => {
    const grouped = {}
    
    dividends.forEach(div => {
      if (!grouped[div.symbol]) {
        grouped[div.symbol] = {
          symbol: div.symbol,
          totalAmount: 0,
          count: 0,
          dividends: [],
          latestDate: null
        }
      }
      grouped[div.symbol].totalAmount += div.amount
      grouped[div.symbol].count += 1
      grouped[div.symbol].dividends.push(div)
      
      const divDate = new Date(div.date)
      if (!grouped[div.symbol].latestDate || divDate > grouped[div.symbol].latestDate) {
        grouped[div.symbol].latestDate = divDate
      }
    })

    // Sort dividends within each group by date (newest first)
    Object.values(grouped).forEach(group => {
      group.dividends.sort((a, b) => new Date(b.date) - new Date(a.date))
    })

    return grouped
  }, [dividends])

  // Get sorted list of symbols by total amount
  const sortedSymbols = useMemo(() => {
    return Object.values(dividendsBySymbol)
      .sort((a, b) => b.totalAmount - a.totalAmount)
  }, [dividendsBySymbol])

  // Calculate grand total
  const grandTotal = useMemo(() => {
    return dividends.reduce((sum, d) => sum + d.amount, 0)
  }, [dividends])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'symbol' ? value.toUpperCase() : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.symbol || !formData.amount) return

    setIsSubmitting(true)

    // Find stock ID if exists
    const stock = stocks.find(s => s.symbol === formData.symbol.toUpperCase())

    const result = await supabaseService.addDividend({
      stockId: stock?.id || null,
      symbol: formData.symbol,
      amount: parseFloat(formData.amount),
      date: formData.date,
      notes: formData.notes
    })

    if (result) {
      setDividends(prev => [result, ...prev])
      setFormData({
        symbol: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      })
      onDividendChange?.()
    }

    setIsSubmitting(false)
  }

  const handleDelete = async (dividendId) => {
    if (!window.confirm('Are you sure you want to delete this dividend?')) {
      return
    }

    const success = await supabaseService.deleteDividend(dividendId)
    
    if (success) {
      setDividends(prev => prev.filter(d => d.id !== dividendId))
      onDividendChange?.()
      
      // If the modal is open and this was the last dividend for this symbol, close the modal
      if (selectedSymbol) {
        const remainingForSymbol = dividends.filter(d => d.symbol === selectedSymbol && d.id !== dividendId)
        if (remainingForSymbol.length === 0) {
          setSelectedSymbol(null)
        }
      }
    } else {
      alert('Failed to delete dividend. Please try again.')
    }
  }

  const handleSymbolClick = (symbol) => {
    setSelectedSymbol(symbol)
  }

  const handleCloseModal = () => {
    setSelectedSymbol(null)
  }

  if (!isSupabaseConfigured()) {
    return (
      <div className="dividends-tab">
        <div className="empty-summary">
          <span className="empty-icon">💰</span>
          <h3>Supabase Required</h3>
          <p>Dividend tracking requires Supabase connection</p>
        </div>
      </div>
    )
  }

  // Get selected symbol data for modal
  const selectedDividendData = selectedSymbol ? dividendsBySymbol[selectedSymbol] : null

  return (
    <div className="dividends-tab">
      {/* Add Dividend Form */}
      <div className="dividend-form-section">
        <h2 className="section-title">
          <span className="title-icon">💰</span>
          Add Dividend
        </h2>
        <form className="dividend-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="symbol">Stock Symbol</label>
              <select
                id="symbol"
                name="symbol"
                value={formData.symbol}
                onChange={handleChange}
                required
              >
                <option value="">Select stock...</option>
                {stocks.map(stock => (
                  <option key={stock.symbol} value={stock.symbol}>
                    {stock.symbol} - {stock.category}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="amount">Dividend Amount (PKR)</label>
              <input
                type="number"
                id="amount"
                name="amount"
                placeholder="Total dividend received"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="date">Date</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notes <span className="optional">(optional)</span></label>
              <input
                type="text"
                id="notes"
                name="notes"
                placeholder="e.g., Q1 2026 dividend"
                value={formData.notes}
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            type="submit"
            className={`btn btn-primary ${isSubmitting ? 'loading' : ''}`}
            disabled={isSubmitting}
          >
            <span className="btn-icon">+</span>
            Add Dividend
          </button>
        </form>
      </div>

      {/* Dividend Portfolio Table */}
      <section className="portfolio-section">
        <div className="section-header">
          <h2 className="section-title">
            <span className="title-icon">💰</span>
            Dividend Portfolio
          </h2>
          <div className="dividend-grand-total">
            <span className="total-label">Total Dividends:</span>
            <span className="total-value positive">{formatCurrency(grandTotal)}</span>
          </div>
        </div>

        {isLoading ? (
          <div className="loading-state">Loading dividends...</div>
        ) : sortedSymbols.length === 0 ? (
          <div className="empty-state visible">
            <span className="empty-icon">💸</span>
            <p>No dividends recorded yet</p>
            <span className="empty-hint">Add your first dividend above to get started</span>
          </div>
        ) : (
          <div className="table-container">
            <table className="portfolio-table dividends-portfolio-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Payments</th>
                  <th>Total Dividends</th>
                  <th>Last Payment</th>
                  <th>Avg. per Payment</th>
                </tr>
              </thead>
              <tbody>
                {sortedSymbols.map(item => (
                  <tr key={item.symbol}>
                    <td className="symbol">
                      <button 
                        className="symbol-link"
                        onClick={() => handleSymbolClick(item.symbol)}
                        title="View dividend history"
                      >
                        {item.symbol}
                      </button>
                    </td>
                    <td className="payments-count">
                      <span className="payment-badge">{item.count}</span>
                    </td>
                    <td className="total-amount positive">
                      {formatCurrency(item.totalAmount)}
                    </td>
                    <td className="last-payment">
                      {item.latestDate?.toLocaleDateString('en-PK', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="avg-payment">
                      {formatCurrency(item.totalAmount / item.count)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Dividend Detail Modal */}
      {selectedDividendData && (
        <DividendDetailModal
          symbol={selectedSymbol}
          dividends={selectedDividendData.dividends}
          totalAmount={selectedDividendData.totalAmount}
          onClose={handleCloseModal}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
