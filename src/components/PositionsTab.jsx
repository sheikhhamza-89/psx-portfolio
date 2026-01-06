import { StockForm } from './StockForm'
import { PortfolioTable } from './PortfolioTable'

export function PositionsTab({ 
  stocks, 
  onAddStock, 
  onEdit, 
  onDelete, 
  onRefresh, 
  isRefreshing,
  editingStock,
  onCancelEdit,
  onSymbolClick
}) {
  return (
    <div className="positions-tab">
      <StockForm 
        onSubmit={onAddStock}
        editingStock={editingStock}
        onCancelEdit={onCancelEdit}
      />
      
      <PortfolioTable 
        stocks={stocks}
        onEdit={onEdit}
        onDelete={onDelete}
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
        onSymbolClick={onSymbolClick}
      />
    </div>
  )
}
