/**
 * Seed script — populates holdings, trades, and watchlist for a user.
 *
 * Usage (run once after signing in for the first time):
 *   npx ts-node scripts/seed-test-data.ts <user_id>
 *
 * Find your user_id in Supabase Dashboard → Authentication → Users
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL ?? '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY ?? '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars');
  process.exit(1);
}

const userId = process.argv[2];
if (!userId) {
  console.error('Usage: npx ts-node scripts/seed-test-data.ts <user_id>');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function seed() {
  console.log(`Seeding data for user: ${userId}`);

  // Holdings
  const { error: holdingsError } = await supabase.from('holdings').upsert([
    { user_id: userId, symbol: 'AAPL', shares: 50,   avg_cost_basis: 182.50 },
    { user_id: userId, symbol: 'MSFT', shares: 8,    avg_cost_basis: 405.00 },
    { user_id: userId, symbol: 'VTI',  shares: 20,   avg_cost_basis: 245.00 },
    { user_id: userId, symbol: 'JNJ',  shares: 15,   avg_cost_basis: 158.20 },
  ]);
  if (holdingsError) { console.error('Holdings error:', holdingsError.message); return; }
  console.log('✓ Holdings seeded');

  // Trades
  const { error: tradesError } = await supabase.from('trades').insert([
    { user_id: userId, symbol: 'AAPL', side: 'buy', order_type: 'market', shares: 50,  price: 182.50, total: 9125.00 },
    { user_id: userId, symbol: 'MSFT', side: 'buy', order_type: 'market', shares: 8,   price: 405.00, total: 3240.00 },
    { user_id: userId, symbol: 'VTI',  side: 'buy', order_type: 'market', shares: 20,  price: 245.00, total: 4900.00 },
    { user_id: userId, symbol: 'JNJ',  side: 'buy', order_type: 'market', shares: 15,  price: 158.20, total: 2373.00 },
  ]);
  if (tradesError) { console.error('Trades error:', tradesError.message); return; }
  console.log('✓ Trades seeded');

  // Watchlist
  const { error: watchlistError } = await supabase.from('watchlist').upsert([
    { user_id: userId, symbol: 'AAPL' },
    { user_id: userId, symbol: 'MSFT' },
    { user_id: userId, symbol: 'SPY'  },
    { user_id: userId, symbol: 'QQQ'  },
  ]);
  if (watchlistError) { console.error('Watchlist error:', watchlistError.message); return; }
  console.log('✓ Watchlist seeded');

  // Update virtual balance to reflect purchases
  const spent = 9125 + 3240 + 4900 + 2373;
  const { error: balanceError } = await supabase
    .from('users')
    .update({ virtual_balance: 100000 - spent })
    .eq('id', userId);
  if (balanceError) { console.error('Balance error:', balanceError.message); return; }
  console.log(`✓ Virtual balance updated to $${100000 - spent}`);

  console.log('\nSeed complete!');
}

seed();
