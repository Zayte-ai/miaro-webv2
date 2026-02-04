import { authenticateAdmin } from '../src/lib/auth';

async function run() {
  const email = 'admin@maisonmiaro.com';
  const pwd = 'admin123';
  const res = await authenticateAdmin(email, pwd);
  console.log('Result:', res);
}

run().catch(console.error);
