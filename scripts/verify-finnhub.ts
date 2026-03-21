import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Read API key from .env file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const match = envContent.match(/FINNHUB_API_KEY=(.+)/);
const API_KEY = match ? match[1].trim() : '';

if (!API_KEY || API_KEY === 'your_actual_key_here') {
  console.error('ERROR: Set your real API key in .env first');
  process.exit(1);
}

async function verify() {
  try {
    console.log('=== Finnhub API Verification ===\n');

    // Test 1: Quote
    const quote = await axios.get(
      `https://finnhub.io/api/v1/quote?symbol=AAPL&token=${API_KEY}`
    );
    console.log('✓ Quote endpoint working');
    console.log(`  AAPL Price: $${quote.data.c}`);
    console.log(`  Day Change: ${quote.data.d > 0 ? '+' : ''}${quote.data.d}\n`);

    // Test 2: Search
    const search = await axios.get(
      `https://finnhub.io/api/v1/search?q=apple&token=${API_KEY}`
    );
    console.log('✓ Search endpoint working');
    console.log(`  Results: ${search.data.result.length} matches\n`);

    // Test 3: Profile
    const profile = await axios.get(
      `https://finnhub.io/api/v1/stock/profile2?symbol=AAPL&token=${API_KEY}`
    );
    console.log('✓ Profile endpoint working');
    console.log(`  Company: ${profile.data.name}`);
    console.log(`  Industry: ${profile.data.finnhubIndustry}\n`);

    console.log('=== ALL CHECKS PASSED ===');
  } catch (error: any) {
    if (error.response?.status === 401) {
      console.error('FAILED: Invalid API key');
    } else if (error.response?.status === 429) {
      console.error('FAILED: Rate limited — wait 60 seconds and retry');
    } else {
      console.error('FAILED:', error.message);
    }
    process.exit(1);
  }
}

verify();
