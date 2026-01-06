import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { formatCurrency, formatNumber } from '../../utils/formatters'

// Custom color palette matching the terminal aesthetic
const COLORS = [
  '#00e5a0', // primary green
  '#39bae6', // secondary blue
  '#ff9940', // tertiary orange
  '#ff6b6b', // loss red
  '#a78bfa', // purple
  '#f472b6', // pink
  '#facc15', // yellow
  '#22d3ee', // cyan
  '#4ade80', // lime
  '#fb923c', // amber
]

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="chart-tooltip">
        <p className="tooltip-label">{data.symbol}</p>
        <p className="tooltip-value">{formatCurrency(data.value)}</p>
        <p className="tooltip-percent">{data.percent.toFixed(1)}% of portfolio</p>
      </div>
    )
  }
  return null
}

const CustomLegend = ({ payload }) => {
  return (
    <div className="chart-legend">
      {payload.map((entry, index) => (
        <div key={index} className="legend-item">
          <span 
            className="legend-color" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="legend-label">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export function AllocationChart({ stocks }) {
  if (stocks.length === 0) return null

  // Calculate total portfolio value
  const totalValue = stocks.reduce((sum, stock) => 
    sum + (stock.shares * (stock.currentPrice || stock.purchasePrice)), 0
  )

  // Prepare data for pie chart
  const data = stocks.map(stock => {
    const value = stock.shares * (stock.currentPrice || stock.purchasePrice)
    return {
      symbol: stock.symbol,
      value,
      percent: (value / totalValue) * 100
    }
  }).sort((a, b) => b.value - a.value)

  return (
    <div className="chart-container">
      <h3 className="chart-title">
        <span className="chart-icon">◐</span>
        Portfolio Allocation
      </h3>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              nameKey="symbol"
              animationBegin={0}
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]}
                  stroke="rgba(0,0,0,0.3)"
                  strokeWidth={1}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-center-label">
        <span className="center-value">{formatCurrency(totalValue)}</span>
        <span className="center-label">Total Value</span>
      </div>
    </div>
  )
}

