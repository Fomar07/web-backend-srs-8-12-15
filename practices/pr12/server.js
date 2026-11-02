require('dotenv').config();
const app = require('./app');
const db = require('./db');
const lab = require('./lab.json');
const port = Number(process.env.PORT || lab.port);
let server;
async function start() {
  if (lab.stage >= 14 && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32))
    throw new Error('JWT_SECRET должен содержать не менее 32 символов');
  await db.connect();
  if (lab.stage >= 11) await require('./models/Workout').init();
  if (lab.stage >= 13) await require('./models/User').init();
  server = app.listen(port, '0.0.0.0', () => console.log(`API и Vue: http://127.0.0.1:${port}`));
}
async function shutdown(signal) {
  console.log(`${signal}: завершение HTTP-запросов и отключение MongoDB`);
  const timer = setTimeout(() => process.exit(1), 10000).unref();
  if (server) await new Promise(resolve => server.close(resolve));
  await db.close(); clearTimeout(timer); process.exit(0);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
start().catch(e => { console.error(e.message); process.exit(1); });
