import { performance } from "perf_hooks";
import * as dotenv from "dotenv";

dotenv.config();

const URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const TOKEN = process.argv[2] || "test-token"; // Run with: npx tsx scripts/loadtest-audience.ts <token>
const CONCURRENT = 100;

async function loadTest() {
  console.log(`Starting load test against ${URL}/p/${TOKEN} with ${CONCURRENT} concurrent viewers...`);
  
  const latencies: number[] = [];
  const errors: any[] = [];

  // Fire all requests concurrently
  const promises = Array.from({ length: CONCURRENT }).map(async (_, i) => {
    const start = performance.now();
    try {
      const res = await fetch(`${URL}/p/${TOKEN}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      // Ensure we consume the body
      await res.text();
      const end = performance.now();
      latencies.push(end - start);
    } catch (err: any) {
      errors.push(err.message);
    }
  });

  await Promise.all(promises);

  latencies.sort((a, b) => a - b);
  const p95Index = Math.floor(latencies.length * 0.95);
  const p95 = latencies[p95Index] || 0;
  const avg = latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1);

  console.log(`\n--- Results ---`);
  console.log(`Total Requests: ${CONCURRENT}`);
  console.log(`Successful: ${latencies.length}`);
  console.log(`Failed: ${errors.length}`);
  if (errors.length > 0) {
    console.log(`Errors:`, Array.from(new Set(errors)));
  }
  console.log(`Average Latency: ${avg.toFixed(2)} ms`);
  console.log(`P95 Latency: ${p95.toFixed(2)} ms`);
  
  if (p95 > 500) {
    console.error(`\n❌ Failed: P95 latency (${p95.toFixed(2)} ms) exceeds 500 ms`);
    process.exit(1);
  } else if (errors.length > 0) {
    console.error(`\n❌ Failed: ${errors.length} requests failed`);
    process.exit(1);
  } else {
    console.log(`\n✅ Passed: P95 latency is under 500 ms`);
    process.exit(0);
  }
}

loadTest().catch(console.error);
