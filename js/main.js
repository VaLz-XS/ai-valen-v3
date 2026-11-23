/* ui controls: sidebar, modal, history */

const sidebar = document.getElementById('sidebar')
const overlay = document.getElementById('overlay')
const toggleBtn = document.getElementById('toggleSidebar')
const newChatBtn = document.getElementById('newChat')
const openSetting = document.getElementById('openSetting')
const closeSetting = document.getElementById('closeSetting')
const settingModal = document.getElementById('settingModal')
const inputApiKey = document.getElementById('inputApiKey')
const selectModel = document.getElementById('selectModel')
const btnSaveSetting = document.getElementById('btnSaveSetting')
const historyList = document.getElementById('historyList')

/* sidebar toggle */
function openSidebar() {
  sidebar.classList.add('open')
  overlay.classList.add('show')
}

function closeSidebar() {
  sidebar.classList.remove('open')
  overlay.classList.remove('show')
}

toggleBtn.addEventListener('click', () => {
  sidebar.classList.contains('open') ? closeSidebar() : openSidebar()
})

overlay.addEventListener('click', closeSidebar)

/* new chat */
newChatBtn.addEventListener('click', () => {
  newSession()
  messages.innerHTML = ''
  welcomeScreen.style.display = ''
  renderHistory()
  closeSidebar()
})

/* setting modal */
openSetting.addEventListener('click', () => {
  inputApiKey.value = getApiKey()
  selectModel.value = getModel()
  settingModal.classList.add('show')
})

closeSetting.addEventListener('click', () => settingModal.classList.remove('show'))

settingModal.addEventListener('click', (e) => {
  if (e.target === settingModal) settingModal.classList.remove('show')
})

btnSaveSetting.addEventListener('click', () => {
  localStorage.setItem('aivalen_apikey', inputApiKey.value.trim())
  localStorage.setItem('aivalen_model', selectModel.value)
  settingModal.classList.remove('show')

  const badge = document.getElementById('modelBadge')
  if (badge) badge.textContent = selectModel.value.replace('claude-','')
})

/* render history list */
function renderHistory() {
  const list = getAllSessions()
  historyList.innerHTML = ''

  if (!list.length) {
    historyList.innerHTML = '<p class="history-empty">Belum ada percakapan</p>'
    return
  }

  for (const sess of list) {
    const item = document.createElement('div')
    item.className = 'history-item' + (sess.id === activeId ? ' active' : '')
    item.textContent = sess.title
    item.addEventListener('click', () => {
      switchSession(sess.id)
      loadSession(sess.id)
      closeSidebar()
      renderHistory()
    })
    historyList.appendChild(item)
  }
}

/* load session ke UI */
function loadSession(id) {
  messages.innerHTML = ''
  const msgs = getMessages(id)

  if (!msgs.length) {
    welcomeScreen.style.display = ''
    return
  }

  welcomeScreen.style.display = 'none'

  for (const m of msgs) {
    if (m.role === 'system') continue
    const role = m.role === 'assistant' ? 'ai' : 'user'
    const text = typeof m.content === 'string'
      ? m.content
      : m.content?.find(c => c.type === 'text')?.text || ''
    appendMsg(role, text)
  }
}

/* init */
getActive()
renderHistory()
loadSession(activeId)
