import { useState, useCallback } from 'react'
import { Header, TabNavigation, SummaryTab, DailyTab, PositionsTab, StockFocusTab, DividendsTab, StockDetailModal, Toast, Footer } from './components'
import { useSupabasePortfolio, useToast } from './hooks'

function App() {
  const { 
    stocks, 
    stats, 
    isLoading,
    isUsingSupabase,
    addStock, 
    sellStock, 
    updateStock, 
    deleteStock, 
    deleteTransaction, 
    refreshPrices 
  } = useSupabasePortfolio()
  const { toast, showToast } = useToast()
  const [activeTab, setActiveTab] = useState('summary')
  const [editingStock, setEditingStock] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedStock, setSelectedStock] = useState(null)

  const handleAddStock = useCallback(async (stockData) => {
    if (editingStock) {
      // Update existing stock
      await updateStock(editingStock.id, {
        symbol: stockData.symbol,
        category: stockData.category,
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

  const handleSellStock = useCallback(async (sellData) => {
    await sellStock(sellData, showToast)
  }, [sellStock, showToast])

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab)
    // Reset editing state when switching tabs
    if (tab === 'summary') {
      setEditingStock(null)
    }
  }, [])

  const handleSymbolClick = useCallback((stock) => {
    setSelectedStock(stock)
  }, [])

  const handleCloseModal = useCallback(() => {
    setSelectedStock(null)
  }, [])

  const handleDeleteTransaction = useCallback((symbol, transactionId) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      deleteTransaction(symbol, transactionId, showToast)
      // Update the selected stock to reflect changes
      setSelectedStock(prev => {
        if (!prev) return null
        const updatedStock = stocks.find(s => s.symbol === symbol)
        return updatedStock || null
      })
    }
  }, [deleteTransaction, showToast, stocks])

  // Get the latest version of selected stock from stocks array
  const currentSelectedStock = selectedStock 
    ? stocks.find(s => s.symbol === selectedStock.symbol) 
    : null

  // Show loading state while initializing
  if (isLoading) {
    return (
      <div className="app-container">
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>Loading portfolio...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      <Header stats={stats} isUsingSupabase={isUsingSupabase} />
      
      <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      
      <main className="main-content">
        {activeTab === 'summary' && (
          <SummaryTab stocks={stocks} stats={stats} />
        )}

        {activeTab === 'daily' && (
          <DailyTab stocks={stocks} />
        )}
        
        {activeTab === 'positions' && (
          <PositionsTab
            stocks={stocks}
            onAddStock={handleAddStock}
            onSell={handleSellStock}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            editingStock={editingStock}
            onCancelEdit={handleCancelEdit}
            onSymbolClick={handleSymbolClick}
          />
        )}

        {activeTab === 'focus' && (
          <StockFocusTab stocks={stocks} />
        )}

        {activeTab === 'dividends' && (
          <DividendsTab stocks={stocks} />
        )}
      </main>

      <Footer />
      
      <Toast 
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
      />

      {currentSelectedStock && (
        <StockDetailModal
          stock={currentSelectedStock}
          onClose={handleCloseModal}
          onDeleteTransaction={handleDeleteTransaction}
        />
      )}
    </div>
  )
}

export default App
