// Vercel serverless function. Env vars: IMGBB_KEY (required), FIREBASE_API_KEY (to verify admin tokens)
// Body: { image: <base64>, name: string, idToken?: string, admin?: boolean }
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const { image, name, idToken, admin } = req.body || {};
    if (!image || typeof image !== 'string' || image.length > 6e6) return res.status(400).json({ error: 'Invalid or oversized image' });
    if (admin) { // watermark uploads need a signed-in Firebase user
      const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.FIREBASE_API_KEY}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }) });
      if (!r.ok) return res.status(401).json({ error: 'Not authorized' });
    }
    const fd = new URLSearchParams({ key: process.env.IMGBB_KEY, image, name: (name || 'photo').slice(0, 80) });
    const r = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: fd });
    const j = await r.json();
    if (!j.success) return res.status(502).json({ error: j.error?.message || 'ImgBB error' });
    res.json({ url: j.data.url, thumb: j.data.thumb?.url || '', deleteUrl: j.data.delete_url || '' });
  } catch (e) { res.status(500).json({ error: e.message }); }
}
