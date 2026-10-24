const app = require('./app.cjs');
const port = Number(process.env.PORT || 3108);
async function start() {
  
  const server = app.listen(port, '127.0.0.1', () => console.log(`API http://127.0.0.1:${port}`));
  process.on('SIGINT', () => server.close(async () => {  process.exit(0); }));
}
start().catch(() => { console.error('Startup failed: check database and environment'); process.exit(1); });
