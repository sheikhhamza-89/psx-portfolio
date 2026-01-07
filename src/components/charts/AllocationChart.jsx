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
      percent: totalValue > 0 ? (value / totalValue) * 100 : 0
    }
  }).sort((a, b) => b.value - a.value)

  return (
    <div className="chart-container chart-3d">
      <h3 className="chart-title">
        <span className="chart-icon">◐</span>
        Portfolio Allocation
      </h3>
      <div className="chart-wrapper-3d">
        <div className="pie-3d-container">
          {/* 3D Shadow/Depth layers */}
          <div className="pie-3d-shadow"></div>
          <div className="pie-3d-depth">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={90}
                  paddingAngle={1}
                  dataKey="value"
                  nameKey="symbol"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-depth-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      fillOpacity={0.4}
                      stroke="none"
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Main pie chart */}
          <div className="pie-3d-main">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={90}
                  paddingAngle={1}
                  dataKey="value"
                  nameKey="symbol"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="chart-legend-container">
          <CustomLegend payload={data.map((d, i) => ({ value: d.symbol, color: COLORS[i % COLORS.length] }))} />
        </div>
      </div>
      <div className="chart-center-label-3d">
        <span className="center-value">{formatCurrency(totalValue)}</span>
        <span className="center-label">Total Value</span>
      </div>
    </div>
  )
}

