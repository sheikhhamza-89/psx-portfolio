import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'
import { formatNumber, formatCurrency } from '../../utils/formatters'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    const isPositive = data.pnl >= 0
    return (
      <div className="chart-tooltip">
        <p className="tooltip-label">{label}</p>
        <p className={`tooltip-value ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? '+' : ''}{formatCurrency(data.pnl)}
        </p>
        <p className="tooltip-percent">
          {isPositive ? '+' : ''}{data.pnlPercent.toFixed(2)}%
        </p>
      </div>
    )
  }
  return null
}

export function PnLChart({ stocks }) {
  if (stocks.length === 0) return null

  // Prepare data for bar chart
  const data = stocks.map(stock => {
    const investment = stock.shares * stock.purchasePrice
    const currentValue = stock.shares * (stock.currentPrice || stock.purchasePrice)
    const pnl = currentValue - investment
    const pnlPercent = investment > 0 ? (pnl / investment) * 100 : 0

    return {
      symbol: stock.symbol,
      pnl,
      pnlPercent,
      investment,
      currentValue
    }
  }).sort((a, b) => b.pnl - a.pnl)

  // Calculate max value for symmetrical Y axis
  const maxAbsPnL = Math.max(...data.map(d => Math.abs(d.pnl)))
  const yDomain = [-maxAbsPnL * 1.1, maxAbsPnL * 1.1]

  return (
    <div className="chart-container">
      <h3 className="chart-title">
        <span className="chart-icon">◧</span>
        Profit & Loss by Stock
      </h3>
      <div className="chart-wrapper pnl-chart">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart 
            data={data} 
            margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
            barCategoryGap="20%"
          >
            <XAxis 
              dataKey="symbol" 
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: 'JetBrains Mono' }}
            />
            <YAxis 
              domain={yDomain}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#5c6773', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              tickFormatter={(value) => {
                if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(0)}K`
                return value.toFixed(0)
              }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />
            <Bar 
              dataKey="pnl" 
              radius={[4, 4, 0, 0]}
              animationBegin={0}
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={entry.pnl >= 0 ? '#00e5a0' : '#ff6b6b'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

