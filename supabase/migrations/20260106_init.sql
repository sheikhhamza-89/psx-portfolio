CREATE TABLE IF NOT EXISTS stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(20) NOT NULL,
  category VARCHAR(50),
  shares DECIMAL(15, 4) NOT NULL DEFAULT 0,
  purchase_price DECIMAL(15, 4) NOT NULL,
  current_price DECIMAL(15, 4),
  ldp DECIMAL(15, 4),
  high_52w DECIMAL(15, 4),
  day_low DECIMAL(15, 4),
  day_high DECIMAL(15, 4),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID,
  UNIQUE(symbol, user_id)
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id UUID REFERENCES stocks(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('buy', 'sell')),
  shares DECIMAL(15, 4) NOT NULL,
  price DECIMAL(15, 4) NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID
);

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

-- Enable Row Level Security
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_cache ENABLE ROW LEVEL SECURITY;

-- Stocks policies
CREATE POLICY "Allow all for anonymous stocks" ON stocks
  FOR ALL USING (user_id IS NULL) WITH CHECK (user_id IS NULL);

CREATE POLICY "Users can manage their own stocks" ON stocks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Allow all for anonymous transactions" ON transactions
  FOR ALL USING (user_id IS NULL) WITH CHECK (user_id IS NULL);

CREATE POLICY "Users can manage their own transactions" ON transactions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Price cache is public (no user-specific data)
CREATE POLICY "Allow all for price cache" ON price_cache
  FOR ALL USING (true) WITH CHECK (true);
