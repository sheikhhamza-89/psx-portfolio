import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { formatCurrency } from '../../utils/formatters'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="tooltip-label">{label}</p>
        <p className="tooltip-value investment">
          Investment: {formatCurrency(payload[0]?.value || 0)}
        </p>
        <p className="tooltip-value current">
          Current: {formatCurrency(payload[1]?.value || 0)}
        </p>
      </div>
    )
  }
  return null
}

export function PerformanceChart({ stocks }) {
  if (stocks.length === 0) return null

  // Sort stocks by investment size and create cumulative data
  const sortedStocks = [...stocks].sort((a, b) => 
    (b.shares * b.purchasePrice) - (a.shares * a.purchasePrice)
  )

  const data = sortedStocks.map(stock => ({
    symbol: stock.symbol,
    investment: stock.shares * stock.purchasePrice,
    current: stock.shares * (stock.currentPrice || stock.purchasePrice)
  }))

  return (
    <div className="chart-container wide">
      <h3 className="chart-title">
        <span className="chart-icon">◨</span>
        Investment vs Current Value
      </h3>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart 
            data={data}
            margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
          >
            <defs>
              <linearGradient id="investmentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#39bae6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#39bae6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="currentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00e5a0" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#00e5a0" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis 
              dataKey="symbol"
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: 'JetBrains Mono' }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#5c6773', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              tickFormatter={(value) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
                return value.toFixed(0)
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="investment" 
              stroke="#39bae6" 
              strokeWidth={2}
              fill="url(#investmentGradient)"
              animationDuration={800}
            />
            <Area 
              type="monotone" 
              dataKey="current" 
              stroke="#00e5a0" 
              strokeWidth={2}
              fill="url(#currentGradient)"
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-legend horizontal">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#39bae6' }} />
          <span className="legend-label">Investment</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#00e5a0' }} />
          <span className="legend-label">Current Value</span>
        </div>
      </div>
    </div>
  )
}

