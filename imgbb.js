// Vercel serverless function: /api/imgbb
// Env var required: IMGBB_KEY  (Vercel > Project > Settings > Environment Variables)
export const config = { api: { bodyParser: { sizeLimit: "4.5mb" } } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const { image, name } = req.body || {};
  // base64 only; allow JPEG / PNG / WEBP signatures
  const okSig = typeof image === "string" && /^(\/9j\/|iVBOR|UklGR)/.test(image);
  if (!okSig || image.length > 4.4e6) return res.status(400).json({ error: "Invalid image" });
  try {
    const body = new URLSearchParams();
    body.append("key", process.env.IMGBB_KEY);
    body.append("image", image);
    if (name) body.append("name", String(name).slice(0, 60));
    const r = await fetch("https://api.imgbb.com/1/upload", { method: "POST", body });
    const j = await r.json();
    if (!j.success) return res.status(502).json({ error: j.error?.message || "ImgBB error" });
    const d = j.data;
    res.status(200).json({ url: d.url, thumb: d.thumb?.url || d.url, deleteUrl: d.delete_url || "" });
  } catch (e) {
    res.status(500).json({ error: "Upload failed" });
  }
}
