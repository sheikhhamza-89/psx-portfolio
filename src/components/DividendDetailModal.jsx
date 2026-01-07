import { formatCurrency } from '../utils/formatters'

export function DividendDetailModal({ symbol, dividends, totalAmount, onClose, onDelete }) {
  if (!symbol || !dividends) return null

  const dividendCount = dividends.length

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-section">
            <h2 className="modal-title">{symbol}</h2>
            <span className="dividend-badge">💰 Dividends</span>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Summary Stats */}
        <div className="stock-detail-stats">
          <div className="detail-stat">
            <span className="detail-stat-label">Total Dividends</span>
            <span className="detail-stat-value positive">{formatCurrency(totalAmount)}</span>
          </div>
          <div className="detail-stat">
            <span className="detail-stat-label">Payments Received</span>
            <span className="detail-stat-value">{dividendCount}</span>
          </div>
          <div className="detail-stat">
            <span className="detail-stat-label">Average Payment</span>
            <span className="detail-stat-value">
              {formatCurrency(dividendCount > 0 ? totalAmount / dividendCount : 0)}
            </span>
          </div>
        </div>

        {/* Dividend History */}
        <div className="transactions-section">
          <h3 className="transactions-title">
            <span className="transactions-icon">📋</span>
            Dividend History
          </h3>

          {dividends.length === 0 ? (
            <div className="no-transactions">
              <p>No dividend history available</p>
            </div>
          ) : (
            <div className="transactions-table-container">
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dividends.map((div) => (
                    <tr key={div.id}>
                      <td className="txn-date">
                        {new Date(div.date).toLocaleDateString('en-PK', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="txn-total positive">
                        +{formatCurrency(div.amount)}
                      </td>
                      <td className="notes-cell">{div.notes || '—'}</td>
                      <td className="txn-actions">
                        <button
                          className="action-btn delete"
                          onClick={() => onDelete(div.id)}
                          title="Delete dividend"
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
    </div>
  )
}
