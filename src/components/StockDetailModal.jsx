import { formatCurrency, formatNumber } from '../utils/formatters'
import { STOCK_CATEGORIES } from '../utils/constants'

/**
 * Calculate average cost from transactions using proper cost basis tracking.
 * When shares are sold, the cost basis is reduced proportionally using the current average.
 */
function calculateAverageCostFromTransactions(transactions) {
  if (!transactions || transactions.length === 0) return 0
  
  const sortedTxns = [...transactions].sort((a, b) => 
    new Date(a.date || 0) - new Date(b.date || 0)
  )
  
  let totalShares = 0
  let totalCostBasis = 0
  
  for (const txn of sortedTxns) {
    if (txn.type === 'buy') {
      totalCostBasis += txn.shares * txn.price
      totalShares += txn.shares
    } else if (txn.type === 'sell') {
      if (totalShares > 0) {
        const currentAvg = totalCostBasis / totalShares
        const sharesToSell = Math.min(txn.shares, totalShares)
        totalCostBasis -= sharesToSell * currentAvg
        totalShares -= sharesToSell
      }
    }
  }
  
  return { avgCost: totalShares > 0 ? totalCostBasis / totalShares : 0, costBasis: totalCostBasis }
}

export function StockDetailModal({ stock, onClose, onDeleteTransaction }) {
  if (!stock) return null

  const getCategoryLabel = (value) => {
    const cat = STOCK_CATEGORIES.find(c => c.value === value)
    return cat ? cat.label : value || '—'
  }

  // Calculate totals using proper cost basis tracking
  const transactions = stock.transactions || []
  const totalShares = transactions.reduce((sum, t) => sum + (t.type === 'buy' ? t.shares : -t.shares), 0)
  const { avgCost, costBasis } = calculateAverageCostFromTransactions(transactions)
  const currentValue = totalShares * (stock.currentPrice || avgCost)
  const totalPnl = currentValue - costBasis
  const pnlPercent = costBasis > 0 ? (totalPnl / costBasis) * 100 : 0
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
            <span className="detail-stat-value">{formatCurrency(costBasis)}</span>
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

