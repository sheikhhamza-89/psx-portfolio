-- Dividends table
CREATE TABLE IF NOT EXISTS dividends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id UUID REFERENCES stocks(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  amount DECIMAL(15, 4) NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_dividends_stock_id ON dividends(stock_id);
CREATE INDEX IF NOT EXISTS idx_dividends_symbol ON dividends(symbol);
