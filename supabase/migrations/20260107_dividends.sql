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

-- Enable Row Level Security
ALTER TABLE dividends ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for anonymous users (no auth)
-- This matches the pattern used in the app where user_id can be null
CREATE POLICY "Allow all for anonymous" ON dividends
  FOR ALL
  USING (user_id IS NULL)
  WITH CHECK (user_id IS NULL);

-- Policy: Allow authenticated users to manage their own dividends
CREATE POLICY "Users can manage their own dividends" ON dividends
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
