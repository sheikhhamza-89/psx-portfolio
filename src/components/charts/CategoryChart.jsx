import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { formatCurrency } from '../../utils/formatters'
import { STOCK_CATEGORIES } from '../../utils/constants'

// Color mapping for categories
const CATEGORY_COLORS = {
  oil_gas: '#ff9940',
  banking: '#39bae6',
  cement: '#9ca3af',
  fertilizer: '#00e5a0',
  power: '#facc15',
  steel: '#6b7280',
  technology: '#a78bfa',
  pharma: '#f472b6',
  fmcg: '#fb923c',
  refinery: '#ef4444',
  reit: '#22d3ee',
  insurance: '#4ade80',
  textile: '#c084fc',
  automobile: '#f87171',
  chemical: '#fdba74',
  food: '#86efac',
  telecom: '#60a5fa',
  other: '#5c6773'
}

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="chart-tooltip">
        <p className="tooltip-label">{data.name}</p>
        <p className="tooltip-value">{formatCurrency(data.value)}</p>
        <p className="tooltip-percent">{data.percent.toFixed(1)}% of portfolio</p>
        <p className="tooltip-stocks">{data.stockCount} stock{data.stockCount > 1 ? 's' : ''}</p>
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

export function CategoryChart({ stocks }) {
  if (stocks.length === 0) return null

  // Calculate total portfolio value
  const totalValue = stocks.reduce((sum, stock) => 
    sum + (stock.shares * (stock.currentPrice || stock.purchasePrice)), 0
  )

  // Group by category
  const categoryData = stocks.reduce((acc, stock) => {
    const category = stock.category || 'other'
    const value = stock.shares * (stock.currentPrice || stock.purchasePrice)
    
    if (!acc[category]) {
      acc[category] = { value: 0, stockCount: 0 }
    }
    acc[category].value += value
    acc[category].stockCount += 1
    
    return acc
  }, {})

  // Convert to array and add labels
  const data = Object.entries(categoryData).map(([key, data]) => {
    const categoryInfo = STOCK_CATEGORIES.find(c => c.value === key)
    return {
      name: categoryInfo ? categoryInfo.label : key,
      value: data.value,
      percent: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
      stockCount: data.stockCount,
      category: key
    }
  }).sort((a, b) => b.value - a.value)

  return (
    <div className="chart-container">
      <h3 className="chart-title">
        <span className="chart-icon">◑</span>
        Allocation by Category
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
              nameKey="name"
              animationBegin={0}
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={CATEGORY_COLORS[entry.category] || '#5c6773'}
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
        <span className="center-value">{data.length}</span>
        <span className="center-label">Categories</span>
      </div>
    </div>
  )
}

