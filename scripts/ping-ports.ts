async function check(url: string) {
  try {
    const res = await fetch(url);
    console.log(`${url} -> ${res.status}`);
  } catch (e) {
    console.log(`${url} -> ERROR: ${e.message}`);
  }
}

(async () => {
  await check('http://localhost:3000');
  await check('http://localhost:3001');
})();
