import { AllocationChart, CategoryChart, PnLChart, PerformanceChart } from './charts'

export function PortfolioCharts({ stocks }) {
  if (stocks.length === 0) {
    return null
  }

  return (
    <section className="charts-section">
      <h2 className="section-title">
        <span className="title-icon">◈</span>
        Portfolio Analytics
      </h2>
      
      <div className="charts-grid">
        <AllocationChart stocks={stocks} />
        <CategoryChart stocks={stocks} />
      </div>
      
      <div className="charts-grid">
        <PnLChart stocks={stocks} />
        <PerformanceChart stocks={stocks} />
      </div>
    </section>
  )
}

