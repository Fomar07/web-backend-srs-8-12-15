const entries = new Map();
const TTL = 60000;
function cache(req, res, next) {
  const key = req.originalUrl;
  const hit = entries.get(key);
  if (hit && hit.expires > Date.now()) {
    res.set('X-Cache', 'HIT'); return res.json(hit.data);
  }
  res.set('X-Cache', 'MISS');
  const json = res.json.bind(res);
  res.json = data => {
    if (res.statusCode === 200) {
      if (entries.size >= 100) entries.delete(entries.keys().next().value);
      entries.set(key, { data, expires: Date.now() + TTL });
    }
    return json(data);
  };
  next();
}
cache.invalidate = () => entries.clear();
module.exports = cache;
