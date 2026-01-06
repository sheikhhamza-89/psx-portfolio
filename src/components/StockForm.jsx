import { useState, useEffect } from 'react'
import { STOCK_CATEGORIES, SYMBOL_CATEGORY_MAP } from '../utils/constants'

export function StockForm({ onSubmit, onSell, editingStock, onCancelEdit, stocks }) {
  const [transactionType, setTransactionType] = useState('buy')
  const [formData, setFormData] = useState({
    symbol: '',
    category: '',
    shares: '',
    price: '',
    currentPrice: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isCategoryAutoPopulated, setIsCategoryAutoPopulated] = useState(false)

  // Reset form when editingStock changes
  useEffect(() => {
    if (editingStock) {
      setFormData({
        symbol: editingStock.symbol,
        category: editingStock.category || '',
        shares: editingStock.shares,
        price: editingStock.purchasePrice,
        currentPrice: editingStock.currentPrice || ''
      })
      setTransactionType('buy')
      setIsCategoryAutoPopulated(!!SYMBOL_CATEGORY_MAP[editingStock.symbol])
    } else {
      setFormData({
        symbol: '',
        category: '',
        shares: '',
        price: '',
        currentPrice: ''
      })
      setIsCategoryAutoPopulated(false)
    }
  }, [editingStock])

  // Auto-populate category when symbol changes
  useEffect(() => {
    if (transactionType === 'buy' && formData.symbol) {
      const upperSymbol = formData.symbol.toUpperCase()
      const mappedCategory = SYMBOL_CATEGORY_MAP[upperSymbol]
      
      if (mappedCategory) {
        setFormData(prev => ({ ...prev, category: mappedCategory }))
        setIsCategoryAutoPopulated(true)
      } else {
        // Only clear if it was auto-populated before
        if (isCategoryAutoPopulated) {
          setFormData(prev => ({ ...prev, category: '' }))
        }
        setIsCategoryAutoPopulated(false)
      }
    }
  }, [formData.symbol, transactionType])

  // Get available shares for selling
  const getAvailableShares = () => {
    if (transactionType !== 'sell' || !formData.symbol) return null
    const stock = stocks?.find(s => s.symbol === formData.symbol.toUpperCase())
    return stock ? stock.shares : 0
  }

  const availableShares = getAvailableShares()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'symbol' ? value.toUpperCase() : value
    }))
  }

  const handleTypeChange = (type) => {
    setTransactionType(type)
    // Reset form when switching types
    setFormData({
      symbol: '',
      category: '',
      shares: '',
      price: '',
      currentPrice: ''
    })
    setIsCategoryAutoPopulated(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.symbol || !formData.shares || !formData.price) {
      return
    }

    // For buy transactions, category is required
    if (transactionType === 'buy' && !formData.category) {
      return
    }

    // For sell, check if we have enough shares
    if (transactionType === 'sell') {
      if (availableShares === null || availableShares === 0) {
        alert(`You don't have any ${formData.symbol} shares to sell`)
        return
      }
      if (parseFloat(formData.shares) > availableShares) {
        alert(`You only have ${availableShares} shares of ${formData.symbol}`)
        return
      }
    }

    setIsLoading(true)
    
    if (transactionType === 'sell') {
      await onSell?.({
        symbol: formData.symbol,
        shares: parseFloat(formData.shares),
        price: parseFloat(formData.price)
      })
    } else {
      await onSubmit({
        symbol: formData.symbol,
        category: formData.category,
        shares: parseFloat(formData.shares),
        purchasePrice: parseFloat(formData.price),
        currentPrice: formData.currentPrice ? parseFloat(formData.currentPrice) : null
      })
    }

    setIsLoading(false)
    
    // Reset form
    setFormData({
      symbol: '',
      category: '',
      shares: '',
      price: '',
      currentPrice: ''
    })
    setIsCategoryAutoPopulated(false)
  }

  const handleCancel = () => {
    setFormData({
      symbol: '',
      category: '',
      shares: '',
      price: '',
      currentPrice: ''
    })
    setIsCategoryAutoPopulated(false)
    onCancelEdit?.()
  }

  // Get category label for display
  const getCategoryLabel = (value) => {
    const cat = STOCK_CATEGORIES.find(c => c.value === value)
    return cat ? cat.label : value
  }

  const isEditing = !!editingStock
  const isSelling = transactionType === 'sell'

  return (
    <section className="form-section">
      <h2 className="section-title">
        <span className="title-icon">{isEditing ? '✎' : isSelling ? '−' : '+'}</span>
        <span>{isEditing ? `Edit ${editingStock.symbol}` : isSelling ? 'Sell Stock' : 'Buy Stock'}</span>
      </h2>

      {/* Transaction Type Toggle */}
      {!isEditing && (
        <div className="transaction-type-toggle">
          <button
            type="button"
            className={`toggle-btn buy ${transactionType === 'buy' ? 'active' : ''}`}
            onClick={() => handleTypeChange('buy')}
          >
            ▲ Buy
          </button>
          <button
            type="button"
            className={`toggle-btn sell ${transactionType === 'sell' ? 'active' : ''}`}
            onClick={() => handleTypeChange('sell')}
          >
            ▼ Sell
          </button>
        </div>
      )}
      
      <form className="stock-form" onSubmit={handleSubmit}>
        <div className="form-row">
          {isSelling ? (
            // Sell form - show dropdown of owned stocks
            <div className="form-group">
              <label htmlFor="symbol">Stock to Sell</label>
              <select
                id="symbol"
                name="symbol"
                value={formData.symbol}
                onChange={handleChange}
                required
              >
                <option value="">Select stock...</option>
                {stocks?.filter(s => s.shares > 0).map(stock => (
                  <option key={stock.symbol} value={stock.symbol}>
                    {stock.symbol} ({stock.shares} shares)
                  </option>
                ))}
              </select>
            </div>
          ) : (
            // Buy form - text input for symbol
            <div className="form-group">
              <label htmlFor="symbol">Symbol</label>
              <input
                type="text"
                id="symbol"
                name="symbol"
                placeholder="e.g. OGDC, HBL, PSO"
                value={formData.symbol}
                onChange={handleChange}
                required
                autoComplete="off"
              />
            </div>
          )}

          {!isSelling && (
            <div className="form-group">
              <label htmlFor="category">
                Category
                {isCategoryAutoPopulated && (
                  <span className="auto-badge">Auto</span>
                )}
              </label>
              {isCategoryAutoPopulated ? (
                // Read-only display when auto-populated
                <div className="category-display">
                  <span className={`category-badge ${formData.category}`}>
                    {getCategoryLabel(formData.category)}
                  </span>
                  <input type="hidden" name="category" value={formData.category} />
                </div>
              ) : (
                // Editable dropdown when not auto-populated
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select category...</option>
                  {STOCK_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="shares">
              Shares to {isSelling ? 'Sell' : 'Buy'}
              {isSelling && availableShares !== null && (
                <span className="available-shares">(max: {availableShares})</span>
              )}
            </label>
            <input
              type="number"
              id="shares"
              name="shares"
              placeholder="Number of shares"
              min="1"
              max={isSelling && availableShares ? availableShares : undefined}
              value={formData.shares}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="price">
              {isSelling ? 'Sell Price (PKR)' : 'Purchase Price (PKR)'}
            </label>
            <input
              type="number"
              id="price"
              name="price"
              placeholder="Price per share"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={handleChange}
              required
            />
          </div>
          
          {!isSelling && (
            <div className="form-group">
              <label htmlFor="currentPrice">
                Current Price (PKR) <span className="optional">(optional)</span>
              </label>
              <input
                type="number"
                id="currentPrice"
                name="currentPrice"
                placeholder="Leave blank to fetch"
                min="0"
                step="0.01"
                value={formData.currentPrice}
                onChange={handleChange}
              />
            </div>
          )}
        </div>
        
        <div className="form-actions">
          <button 
            type="submit" 
            className={`btn ${isSelling ? 'btn-sell' : 'btn-primary'} ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            <span className="btn-icon">{isEditing ? '✓' : isSelling ? '−' : '+'}</span>
            {isEditing ? 'Update Stock' : isSelling ? 'Sell Stock' : 'Buy Stock'}
          </button>
          
          {isEditing && (
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={handleCancel}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  )
}
