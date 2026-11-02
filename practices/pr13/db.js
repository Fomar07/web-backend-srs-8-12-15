const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');
const lab = require('./lab.json');
let client;
async function connect() {
  const uri = process.env.MONGO_URL || `mongodb://127.0.0.1:27017/${lab.database}`;
  if (lab.stage < 11) { client = new MongoClient(uri); await client.connect(); }
  else { await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 }); }
  console.log(`MongoDB подключена: ${lab.database}; практика ${lab.number}`);
}
function getDb() { return client ? client.db() : mongoose.connection.db; }
async function close() { if (client) await client.close(); else await mongoose.disconnect(); }
function connected() { return client ? !!client.topology?.isConnected() : mongoose.connection.readyState === 1; }
module.exports = { connect, getDb, close, connected };
