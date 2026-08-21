let _ethPriceCache = { usd: null, ts: 0 };

async function fetchEthUsd() {
  try {
    const r = await fetch('https://api.coinbase.com/v2/prices/ETH-USD/spot');
    const d = await r.json();
    const usd = parseFloat(d?.data?.amount);
    if (usd) return usd;
  } catch (e) { /* try next */ }
  try {
    const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
    const d = await r.json();
    const usd = d?.ethereum?.usd;
    if (usd) return usd;
  } catch (e) { /* give up */ }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const now = Date.now();
    if (_ethPriceCache.usd && now - _ethPriceCache.ts < 60000) {
      return res.status(200).json({ usdPerEth: _ethPriceCache.usd, cached: true });
    }
    
    const usd = await fetchEthUsd();
    if (!usd) throw new Error('No price');
    
    _ethPriceCache = { usd, ts: now };
    res.status(200).json({ usdPerEth: usd, cached: false });
  } catch (err) {
    if (_ethPriceCache.usd) {
      return res.status(200).json({ usdPerEth: _ethPriceCache.usd, cached: true, stale: true });
    }
    res.status(502).json({ error: 'Price feed unavailable' });
  }
}
