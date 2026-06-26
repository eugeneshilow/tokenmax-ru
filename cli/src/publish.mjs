// Thin POST wrapper for /api/tmx/publish. Returns { status, json } and never
// throws on non-2xx — the CLI decides how to present each documented reason.

export async function publish(apiBase, body) {
  const res = await fetch(`${apiBase}/api/tmx/publish`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, json };
}
