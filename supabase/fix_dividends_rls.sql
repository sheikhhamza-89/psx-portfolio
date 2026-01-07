-- ============================================================================
-- FIX RLS POLICIES - Run this in Supabase SQL Editor
-- Go to: Supabase Dashboard > SQL Editor > New Query
-- ============================================================================

-- ============================================================================
-- DIVIDENDS TABLE
-- ============================================================================
ALTER TABLE dividends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for anonymous" ON dividends;
DROP POLICY IF EXISTS "Users can manage their own dividends" ON dividends;

CREATE POLICY "Allow all for anonymous" ON dividends
  FOR ALL USING (user_id IS NULL) WITH CHECK (user_id IS NULL);

CREATE POLICY "Users can manage their own dividends" ON dividends
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- STOCKS TABLE (in case you have issues there too)
-- ============================================================================
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for anonymous stocks" ON stocks;
DROP POLICY IF EXISTS "Users can manage their own stocks" ON stocks;

CREATE POLICY "Allow all for anonymous stocks" ON stocks
  FOR ALL USING (user_id IS NULL) WITH CHECK (user_id IS NULL);

CREATE POLICY "Users can manage their own stocks" ON stocks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- TRANSACTIONS TABLE
-- ============================================================================
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for anonymous transactions" ON transactions;
DROP POLICY IF EXISTS "Users can manage their own transactions" ON transactions;

CREATE POLICY "Allow all for anonymous transactions" ON transactions
  FOR ALL USING (user_id IS NULL) WITH CHECK (user_id IS NULL);

CREATE POLICY "Users can manage their own transactions" ON transactions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- PRICE CACHE TABLE (public, no auth needed)
-- ============================================================================
ALTER TABLE price_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for price cache" ON price_cache;

CREATE POLICY "Allow all for price cache" ON price_cache
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- VERIFY POLICIES
-- ============================================================================
SELECT tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename IN ('dividends', 'stocks', 'transactions', 'price_cache')
ORDER BY tablename;

