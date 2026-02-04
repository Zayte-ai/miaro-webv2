async function test() {
  const url = 'http://localhost:3002/api/admin/auth';
  const email = 'admin@maisonmiaro.com';
  const candidates = ['admin123', 'YourSecurePassword123!Change-This'];

  for (const pwd of candidates) {
    try {
      console.log(`\nTesting password: ${pwd}`);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pwd }),
      });
      const text = await res.text();
      console.log(`Status: ${res.status}`);
      try {
        console.log('Body:', JSON.parse(text));
      } catch {
        console.log('Body (raw):', text);
      }
    } catch (err) {
      console.error('Request failed:', err);
    }
  }
}

test().catch(console.error);
