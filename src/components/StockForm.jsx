import { useState } from 'react'

export function StockForm({ onSubmit, editingStock, onCancelEdit }) {
  const [formData, setFormData] = useState({
    symbol: editingStock?.symbol || '',
    shares: editingStock?.shares || '',
    purchasePrice: editingStock?.purchasePrice || '',
    currentPrice: editingStock?.currentPrice || ''
  })
  const [isLoading, setIsLoading] = useState(false)

  // Reset form when editingStock changes
  useState(() => {
    if (editingStock) {
      setFormData({
        symbol: editingStock.symbol,
        shares: editingStock.shares,
        purchasePrice: editingStock.purchasePrice,
        currentPrice: editingStock.currentPrice || ''
      })
    }
  }, [editingStock])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'symbol' ? value.toUpperCase() : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.symbol || !formData.shares || !formData.purchasePrice) {
      return
    }

    setIsLoading(true)
    
    await onSubmit({
      symbol: formData.symbol,
      shares: parseFloat(formData.shares),
      purchasePrice: parseFloat(formData.purchasePrice),
      currentPrice: formData.currentPrice ? parseFloat(formData.currentPrice) : null
    })

    setIsLoading(false)
    
    // Reset form
    setFormData({
      symbol: '',
      shares: '',
      purchasePrice: '',
      currentPrice: ''
    })
  }

  const handleCancel = () => {
    setFormData({
      symbol: '',
      shares: '',
      purchasePrice: '',
      currentPrice: ''
    })
    onCancelEdit?.()
  }

  const isEditing = !!editingStock

  return (
    <section className="form-section">
      <h2 className="section-title">
        <span className="title-icon">{isEditing ? '✎' : '+'}</span>
        <span>{isEditing ? `Edit ${editingStock.symbol}` : 'Add New Stock'}</span>
      </h2>
      
      <form className="stock-form" onSubmit={handleSubmit}>
        <div className="form-row">
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
          
          <div className="form-group">
            <label htmlFor="shares">Shares</label>
            <input
              type="number"
              id="shares"
              name="shares"
              placeholder="Number of shares"
              min="1"
              value={formData.shares}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="purchasePrice">Purchase Price (PKR)</label>
            <input
              type="number"
              id="purchasePrice"
              name="purchasePrice"
              placeholder="Price per share"
              min="0"
              step="0.01"
              value={formData.purchasePrice}
              onChange={handleChange}
              required
            />
          </div>
          
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
        </div>
        
        <div className="form-actions">
          <button 
            type="submit" 
            className={`btn btn-primary ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            <span className="btn-icon">{isEditing ? '✓' : '+'}</span>
            {isEditing ? 'Update Stock' : 'Add Stock'}
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

