import { useState, useEffect, useMemo } from 'react'
import { formatCurrency } from '../utils/formatters'
import * as supabaseService from '../services/supabaseService'
import { isSupabaseConfigured } from '../lib/supabase'

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

  // Calculate totals
  const totals = useMemo(() => {
    const bySymbol = {}
    let grandTotal = 0

    dividends.forEach(div => {
      if (!bySymbol[div.symbol]) {
        bySymbol[div.symbol] = 0
      }
      bySymbol[div.symbol] += div.amount
      grandTotal += div.amount
    })

    return { bySymbol, grandTotal }
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
    if (!window.confirm('Are you sure you want to delete this dividend?')) return

    const success = await supabaseService.deleteDividend(dividendId)
    if (success) {
      setDividends(prev => prev.filter(d => d.id !== dividendId))
      onDividendChange?.()
    }
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

      {/* Dividend Summary */}
      <div className="dividend-summary-section">
        <h2 className="section-title">
          <span className="title-icon">📊</span>
          Dividend Summary
        </h2>
        
        <div className="dividend-total-card">
          <span className="total-label">Total Dividends Received</span>
          <span className="total-value">{formatCurrency(totals.grandTotal)}</span>
        </div>

        {Object.keys(totals.bySymbol).length > 0 && (
          <div className="dividend-by-symbol">
            <h4>By Stock</h4>
            <div className="symbol-dividends-grid">
              {Object.entries(totals.bySymbol)
                .sort((a, b) => b[1] - a[1])
                .map(([symbol, amount]) => (
                  <div key={symbol} className="symbol-dividend-card">
                    <span className="symbol-name">{symbol}</span>
                    <span className="symbol-amount">{formatCurrency(amount)}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Dividend History */}
      <div className="dividend-history-section">
        <h2 className="section-title">
          <span className="title-icon">📜</span>
          Dividend History
        </h2>

        {isLoading ? (
          <div className="loading-state">Loading dividends...</div>
        ) : dividends.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">💸</span>
            <p>No dividends recorded yet</p>
            <span className="empty-hint">Add your first dividend above</span>
          </div>
        ) : (
          <div className="table-container">
            <table className="dividends-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Symbol</th>
                  <th>Amount</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dividends.map(div => (
                  <tr key={div.id}>
                    <td>{new Date(div.date).toLocaleDateString()}</td>
                    <td className="symbol-cell">{div.symbol}</td>
                    <td className="amount-cell positive">{formatCurrency(div.amount)}</td>
                    <td className="notes-cell">{div.notes || '—'}</td>
                    <td className="actions">
                      <button
                        className="action-btn delete"
                        onClick={() => handleDelete(div.id)}
                        title="Delete"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

