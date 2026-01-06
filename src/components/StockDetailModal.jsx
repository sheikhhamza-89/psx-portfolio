import { formatCurrency, formatNumber } from '../utils/formatters'
import { STOCK_CATEGORIES } from '../utils/constants'

export function StockDetailModal({ stock, onClose, onDeleteTransaction }) {
  if (!stock) return null

  const getCategoryLabel = (value) => {
    const cat = STOCK_CATEGORIES.find(c => c.value === value)
    return cat ? cat.label : value || '—'
  }

  // Calculate totals
  const transactions = stock.transactions || []
  const totalShares = transactions.reduce((sum, t) => sum + (t.type === 'buy' ? t.shares : -t.shares), 0)
  const totalCost = transactions.reduce((sum, t) => sum + (t.type === 'buy' ? t.shares * t.price : 0), 0)
  const avgCost = totalShares > 0 ? totalCost / totalShares : 0
  const currentValue = totalShares * (stock.currentPrice || avgCost)
  const totalPnl = currentValue - totalCost
  const pnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0
  const isPositive = totalPnl >= 0

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-section">
            <h2 className="modal-title">{stock.symbol}</h2>
            <span className={`category-badge ${stock.category || 'other'}`}>
              {getCategoryLabel(stock.category)}
            </span>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Summary Stats */}
        <div className="stock-detail-stats">
          <div className="detail-stat">
            <span className="detail-stat-label">Total Shares</span>
            <span className="detail-stat-value">{formatNumber(totalShares)}</span>
          </div>
          <div className="detail-stat">
            <span className="detail-stat-label">Avg. Cost</span>
            <span className="detail-stat-value">{formatCurrency(avgCost)}</span>
          </div>
          <div className="detail-stat">
            <span className="detail-stat-label">Current Price</span>
            <span className="detail-stat-value current">{formatCurrency(stock.currentPrice || avgCost)}</span>
          </div>
          <div className="detail-stat">
            <span className="detail-stat-label">Total Investment</span>
            <span className="detail-stat-value">{formatCurrency(totalCost)}</span>
          </div>
          <div className="detail-stat">
            <span className="detail-stat-label">Current Value</span>
            <span className="detail-stat-value">{formatCurrency(currentValue)}</span>
          </div>
          <div className="detail-stat">
            <span className="detail-stat-label">Total P&L</span>
            <span className={`detail-stat-value ${isPositive ? 'positive' : 'negative'}`}>
              {isPositive ? '+' : ''}{formatCurrency(totalPnl)} ({pnlPercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Transaction History */}
        <div className="transactions-section">
          <h3 className="transactions-title">
            <span className="transactions-icon">📋</span>
            Transaction History
          </h3>

          {transactions.length === 0 ? (
            <div className="no-transactions">
              <p>No transaction history available</p>
              <span className="hint">Transactions added before this update won't have history</span>
            </div>
          ) : (
            <div className="transactions-table-container">
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Shares</th>
                    <th>Price</th>
                    <th>Total</th>
                    <th>P&L per Share</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn, index) => {
                    const txnTotal = txn.shares * txn.price
                    const pnlPerShare = (stock.currentPrice || txn.price) - txn.price
                    const txnPnlPercent = txn.price > 0 ? (pnlPerShare / txn.price) * 100 : 0
                    const txnIsPositive = pnlPerShare >= 0

                    return (
                      <tr key={txn.id || index}>
                        <td className="txn-date">
                          {new Date(txn.date).toLocaleDateString('en-PK', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td>
                          <span className={`txn-type ${txn.type}`}>
                            {txn.type === 'buy' ? '▲ BUY' : '▼ SELL'}
                          </span>
                        </td>
                        <td className="txn-shares">{formatNumber(txn.shares)}</td>
                        <td className="txn-price">{formatCurrency(txn.price)}</td>
                        <td className="txn-total">{formatCurrency(txnTotal)}</td>
                        <td className={`txn-pnl ${txnIsPositive ? 'positive' : 'negative'}`}>
                          {txnIsPositive ? '+' : ''}{formatCurrency(pnlPerShare)}
                          <span className="txn-pnl-percent">({txnPnlPercent.toFixed(1)}%)</span>
                        </td>
                        <td className="txn-actions">
                          <button
                            className="action-btn delete"
                            onClick={() => onDeleteTransaction(stock.symbol, txn.id)}
                            title="Delete transaction"
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
          )}
        </div>
      </div>
    </div>
  )
}

