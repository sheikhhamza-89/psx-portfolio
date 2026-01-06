import { useState, useCallback } from 'react'
import { Header, TabNavigation, SummaryTab, PositionsTab, Toast, Footer } from './components'
import { usePortfolio, useToast } from './hooks'

function App() {
  const { stocks, stats, addStock, updateStock, deleteStock, refreshPrices } = usePortfolio()
  const { toast, showToast } = useToast()
  const [activeTab, setActiveTab] = useState('summary')
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

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab)
    // Reset editing state when switching tabs
    if (tab === 'summary') {
      setEditingStock(null)
    }
  }, [])

  return (
    <div className="app-container">
      <Header stats={stats} />
      
      <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      
      <main className="main-content">
        {activeTab === 'summary' && (
          <SummaryTab stocks={stocks} stats={stats} />
        )}
        
        {activeTab === 'positions' && (
          <PositionsTab
            stocks={stocks}
            onAddStock={handleAddStock}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            editingStock={editingStock}
            onCancelEdit={handleCancelEdit}
          />
        )}
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
