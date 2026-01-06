import { StockForm } from './StockForm'
import { PortfolioTable } from './PortfolioTable'

export function PositionsTab({ 
  stocks, 
  onAddStock,
  onSell,
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
        onSell={onSell}
        editingStock={editingStock}
        onCancelEdit={onCancelEdit}
        stocks={stocks}
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
