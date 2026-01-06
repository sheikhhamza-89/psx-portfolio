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
