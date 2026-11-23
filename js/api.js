/* api config & sender */

const API_CONFIG = {
  baseURL: 'https://api.vanns.my.id/v1',
  defaultModel: 'claude-sonnet-5-5',
  smallModel: 'claude-haiku-4-5',
  visionModels: ['claude-sonnet-5-5','claude-sonnet-5','claude-opus-4-5','claude-opus-5-5','claude-haiku-5-5']
}

function getApiKey() {
  return localStorage.getItem('aivalen_apikey') || ''
}

function getModel() {
  return localStorage.getItem('aivalen_model') || API_CONFIG.defaultModel
}

function needsVision(files) {
  if (!files || !files.length) return false
  return files.some(f => f.type && f.type.startsWith('image/'))
}

function pickModel(files) {
  const manual = getModel()

  /* kalau manual bukan haiku, pakai manual */
  if (!manual.includes('haiku')) return manual

  /* kalau ada gambar, upgrade ke sonnet */
  if (needsVision(files)) return API_CONFIG.defaultModel

  return manual
}

async function sendToAPI({ messages, files = [] }) {
  const key = getApiKey()
  if (!key) throw new Error('API key belum diset. Buka Setting dulu ya.')

  const model = pickModel(files)

  /* update badge */
  const badge = document.getElementById('modelBadge')
  if (badge) badge.textContent = model.replace('claude-','')

  const res = await fetch(`${API_CONFIG.baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 2048,
      stream: true
    })
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `HTTP ${res.status}`)
  }

  return res
}
