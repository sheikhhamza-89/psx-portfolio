import { formatCurrency, formatPercent } from '../utils/formatters'

export function Header({ stats }) {
  const { totalInvestment, currentValue, totalPnl, totalPnlPercent, isPositive } = stats

  return (
    <header className="header">
      <div className="logo">
        <span className="logo-icon">◈</span>
        <h1>PSX<span className="highlight">Folio</span></h1>
      </div>
      
      <div className="header-stats">
        <div className="stat-item">
          <span className="stat-label">Total Investment</span>
          <span className="stat-value">{formatCurrency(totalInvestment)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Current Value</span>
          <span className="stat-value">{formatCurrency(currentValue)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total P&L</span>
          <span className={`stat-value ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? '+' : ''}{formatCurrency(totalPnl)}
            <span className="stat-percent">({formatPercent(totalPnlPercent)})</span>
          </span>
        </div>
      </div>
    </header>
  )
}

