import { useState, useCallback } from 'react'
import { Header, StockForm, PortfolioTable, PortfolioCharts, Toast, Footer } from './components'
import { usePortfolio, useToast } from './hooks'

function App() {
  const { stocks, stats, addStock, updateStock, deleteStock, refreshPrices } = usePortfolio()
  const { toast, showToast } = useToast()
  const [editingStock, setEditingStock] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleAddStock = useCallback(async (stockData) => {
    if (editingStock) {
      // Update existing stock
      await updateStock(editingStock.id, {
        symbol: stockData.symbol,
        shares: stockData.shares,
        purchasePrice: stockData.purchasePrice,
        currentPrice: stockData.currentPrice || editingStock.currentPrice
      })
      showToast(`Updated ${stockData.symbol}`, 'success')
      setEditingStock(null)
    } else {
      // Add new stock
      await addStock(stockData, showToast)
    }
  }, [editingStock, addStock, updateStock, showToast])

  const handleEdit = useCallback((stock) => {
    setEditingStock(stock)
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleDelete = useCallback((id) => {
    if (window.confirm('Are you sure you want to remove this stock?')) {
      deleteStock(id, showToast)
    }
  }, [deleteStock, showToast])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await refreshPrices(showToast)
    setIsRefreshing(false)
  }, [refreshPrices, showToast])

  const handleCancelEdit = useCallback(() => {
    setEditingStock(null)
  }, [])

  return (
    <div className="app-container">
      <Header stats={stats} />
      
      <main className="main-content">
        <StockForm 
          onSubmit={handleAddStock}
          editingStock={editingStock}
          onCancelEdit={handleCancelEdit}
        />
        
        <PortfolioTable 
          stocks={stocks}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        <PortfolioCharts stocks={stocks} />
      </main>

      <Footer />
      
      <Toast 
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
      />
    </div>
  )
}

export default App

