/* baca & encode file untuk dikirim ke api */

const pendingFiles = []

async function readFileAsBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result.split(',')[1])
    r.onerror = rej
    r.readAsDataURL(file)
  })
}

async function readFileAsText(file) {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result)
    r.onerror = rej
    r.readAsText(file)
  })
}

async function processFile(file) {
  const isImage = file.type.startsWith('image/')
  const isText = !isImage

  if (isImage) {
    const b64 = await readFileAsBase64(file)
    return {
      type: 'image',
      name: file.name,
      mimeType: file.type,
      data: b64,
      url: URL.createObjectURL(file)
    }
  }

  if (isText) {
    const text = await readFileAsText(file)
    return {
      type: 'text',
      name: file.name,
      mimeType: file.type,
      data: text
    }
  }
}

function buildContentParts(text, files) {
  const parts = []

  if (text) parts.push({ type: 'text', text })

  for (const f of files) {
    if (f.type === 'image') {
      parts.push({
        type: 'image_url',
        image_url: { url: `data:${f.mimeType};base64,${f.data}` }
      })
    } else {
      parts.push({
        type: 'text',
        text: `\n\n--- File: ${f.name} ---\n\`\`\`\n${f.data}\n\`\`\`\n---`
      })
    }
  }

  return parts.length === 1 && parts[0].type === 'text' ? text : parts
}

function renderFileChip(f, index) {
  const div = document.createElement('div')
  div.className = 'fp-item'
  div.dataset.index = index

  const icon = f.type === 'image'
    ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>`
    : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`

  div.innerHTML = `
    ${icon}
    <span>${f.name}</span>
    <button class="fp-remove" data-index="${index}">
      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
    </button>
  `
  return div
}
