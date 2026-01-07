-- PSX Portfolio Database Schema for Supabase
-- Run this in Supabase SQL Editor: https://app.supabase.com > SQL Editor

-- ============================================================================
-- STOCKS TABLE - Main portfolio holdings
-- ============================================================================
CREATE TABLE IF NOT EXISTS stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(20) NOT NULL,
  category VARCHAR(50),
  shares DECIMAL(15, 4) NOT NULL DEFAULT 0,
  purchase_price DECIMAL(15, 4) NOT NULL,
  current_price DECIMAL(15, 4),
  ldp DECIMAL(15, 4),                    -- Last Day Closing Price (LDCP)
  high_52w DECIMAL(15, 4),               -- 52 Week High
  day_low DECIMAL(15, 4),                -- Today's Low
  day_high DECIMAL(15, 4),               -- Today's High
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Unique constraint: one entry per symbol per user
  UNIQUE(symbol, user_id)
);

-- ============================================================================
-- TRANSACTIONS TABLE - Buy/Sell history
-- ============================================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id UUID REFERENCES stocks(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('buy', 'sell')),
  shares DECIMAL(15, 4) NOT NULL,
  price DECIMAL(15, 4) NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ============================================================================
-- PRICE_CACHE TABLE - Cached stock prices
-- ============================================================================
CREATE TABLE IF NOT EXISTS price_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(20) NOT NULL UNIQUE,
  price DECIMAL(15, 4),
  ldp DECIMAL(15, 4),
  high_52w DECIMAL(15, 4),
  day_low DECIMAL(15, 4),
  day_high DECIMAL(15, 4),
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES for better query performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_stocks_user_id ON stocks(user_id);
CREATE INDEX IF NOT EXISTS idx_stocks_symbol ON stocks(symbol);
CREATE INDEX IF NOT EXISTS idx_transactions_stock_id ON transactions(stock_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_price_cache_symbol ON price_cache(symbol);
CREATE INDEX IF NOT EXISTS idx_price_cache_cached_at ON price_cache(cached_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - Users can only access their own data
-- ============================================================================

-- Enable RLS on tables
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Stocks policies
CREATE POLICY "Users can view own stocks" ON stocks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stocks" ON stocks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stocks" ON stocks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own stocks" ON stocks
  FOR DELETE USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Price cache is shared (no user restriction)
ALTER TABLE price_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read price cache" ON price_cache
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert price cache" ON price_cache
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update price cache" ON price_cache
  FOR UPDATE USING (true);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on stocks
CREATE TRIGGER stocks_updated_at
  BEFORE UPDATE ON stocks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to clean old cache entries (older than 15 minutes)
CREATE OR REPLACE FUNCTION clean_price_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM price_cache 
  WHERE cached_at < NOW() - INTERVAL '15 minutes';
END;
$$ LANGUAGE plpgsql;

