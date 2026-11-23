/* core chat logic + streaming */

const chatArea = document.getElementById('chatArea')
const messages = document.getElementById('messages')
const welcomeScreen = document.getElementById('welcomeScreen')
const chatInput = document.getElementById('chatInput')
const btnSend = document.getElementById('btnSend')
const filePreview = document.getElementById('filePreview')
const fileInput = document.getElementById('fileInput')
const btnAttach = document.getElementById('btnAttach')

let isStreaming = false

function hideWelcome() {
  if (welcomeScreen) welcomeScreen.style.display = 'none'
}

function scrollBottom() {
  chatArea.scrollTop = chatArea.scrollHeight
}

function appendMsg(role, content, files = []) {
  hideWelcome()
  const wrap = document.createElement('div')
  wrap.className = `msg msg-${role === 'user' ? 'user' : 'ai'}`

  const label = document.createElement('div')
  label.className = 'msg-label'
  label.textContent = role === 'user' ? 'Kamu' : 'Sora'

  const bubble = document.createElement('div')
  bubble.className = 'msg-bubble'

  /* render gambar */
  for (const f of files) {
    if (f.type === 'image') {
      const img = document.createElement('img')
      img.src = f.url
      img.className = 'msg-img'
      bubble.appendChild(img)
    } else {
      const chip = document.createElement('div')
      chip.className = 'msg-file-chip'
      chip.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>${f.name}`
      bubble.appendChild(chip)
    }
  }

  if (typeof content === 'string' && content) {
    bubble.innerHTML += renderMarkdown(content)
  }

  wrap.appendChild(label)
  wrap.appendChild(bubble)
  messages.appendChild(wrap)
  scrollBottom()

  return bubble
}

function renderMarkdown(text) {
  return text
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="lang-$1">$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
}

function showTyping() {
  const wrap = document.createElement('div')
  wrap.className = 'msg msg-ai'
  wrap.id = 'typingIndicator'

  const label = document.createElement('div')
  label.className = 'msg-label'
  label.textContent = 'Sora'

  const bubble = document.createElement('div')
  bubble.className = 'msg-bubble typing-dot'
  bubble.innerHTML = '<span></span><span></span><span></span>'

  wrap.appendChild(label)
  wrap.appendChild(bubble)
  messages.appendChild(wrap)
  scrollBottom()
  return wrap
}

function removeTyping() {
  document.getElementById('typingIndicator')?.remove()
}

async function sendMessage() {
  if (isStreaming) return
  const text = chatInput.value.trim()
  const files = [...pendingFiles]

  if (!text && !files.length) return

  isStreaming = true
  btnSend.disabled = true
  chatInput.value = ''
  chatInput.style.height = 'auto'

  /* render user msg */
  appendMsg('user', text, files)

  /* clear file preview */
  pendingFiles.length = 0
  filePreview.innerHTML = ''

  /* build content & simpan ke memory */
  const content = buildContentParts(text, files)
  pushMessage('user', content)

  /* typing */
  showTyping()

  try {
    const apiMessages = buildAPIMessages()
    const res = await sendToAPI({ messages: apiMessages, files })

    removeTyping()

    /* streaming bubble */
    const aiBubble = appendMsg('ai', '')
    let fullText = ''

    const reader = res.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(l => l.startsWith('data:'))

      for (const line of lines) {
        const data = line.replace('data: ', '').trim()
        if (data === '[DONE]') break
        try {
          const json = JSON.parse(data)
          const delta = json.choices?.[0]?.delta?.content || ''
          fullText += delta
          aiBubble.innerHTML = renderMarkdown(fullText)
          scrollBottom()
        } catch {}
      }
    }

    /* simpan response ke memory */
    pushMessage('assistant', fullText)
    renderHistory()

  } catch (err) {
    removeTyping()
    appendMsg('ai', `Maaf, ada error: ${err.message}`)
  }

  isStreaming = false
  btnSend.disabled = false
  chatInput.focus()
}

/* auto resize textarea */
chatInput.addEventListener('input', () => {
  chatInput.style.height = 'auto'
  chatInput.style.height = Math.min(chatInput.scrollHeight, 160) + 'px'
})

/* kirim dengan Enter (shift+enter = newline) */
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
})

btnSend.addEventListener('click', sendMessage)

/* attach file */
btnAttach.addEventListener('click', () => fileInput.click())

fileInput.addEventListener('change', async () => {
  for (const file of fileInput.files) {
    const processed = await processFile(file)
    pendingFiles.push(processed)
  }
  renderFilePreview()
  fileInput.value = ''
})

function renderFilePreview() {
  filePreview.innerHTML = ''
  pendingFiles.forEach((f, i) => {
    filePreview.appendChild(renderFileChip(f, i))
  })

  filePreview.querySelectorAll('.fp-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      pendingFiles.splice(+btn.dataset.index, 1)
      renderFilePreview()
    })
  })
}
