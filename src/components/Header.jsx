import { formatCurrency, formatPercent } from '../utils/formatters'

export function Header({ stats, isUsingSupabase }) {
  const { totalInvestment, currentValue, totalPnl, totalPnlPercent, isPositive } = stats

  return (
    <header className="header">
      <div className="logo">
        <span className="logo-icon">◈</span>
        <h1>PSX<span className="highlight">Folio</span></h1>
        {isUsingSupabase && (
          <span className="supabase-badge" title="Connected to Supabase">
            <svg width="14" height="14" viewBox="0 0 109 113" fill="none">
              <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="url(#paint0_linear)"/>
              <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="url(#paint1_linear)" fillOpacity="0.2"/>
              <path d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.041L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.16513 56.4175L45.317 2.07103Z" fill="#3ECF8E"/>
              <defs>
                <linearGradient id="paint0_linear" x1="53.9738" y1="54.974" x2="94.1635" y2="71.8295" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#249361"/>
                  <stop offset="1" stopColor="#3ECF8E"/>
                </linearGradient>
                <linearGradient id="paint1_linear" x1="36.1558" y1="30.578" x2="54.4844" y2="65.0806" gradientUnits="userSpaceOnUse">
                  <stop/>
                  <stop offset="1" stopOpacity="0"/>
                </linearGradient>
              </defs>
            </svg>
            Cloud
          </span>
        )}
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

