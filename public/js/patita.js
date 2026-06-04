(() => {
  const messagesEl = document.getElementById('patita-messages');
  const inputEl    = document.getElementById('patita-input');
  const sendBtn    = document.getElementById('patita-send');
  const clearBtn   = document.getElementById('patita-clear-btn');

  let history  = []; // { role, content }
  let busy     = false;

  // ── Init ──────────────────────────────────────────────────────────────────

  sendBtn.addEventListener('click', send);
  clearBtn.addEventListener('click', clearChat);

  inputEl.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });

  inputEl.addEventListener('input', () => {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
  });

  // ── Send ──────────────────────────────────────────────────────────────────

  async function send() {
    const text = inputEl.value.trim();
    if (!text || busy) return;

    inputEl.value = '';
    inputEl.style.height = 'auto';

    appendMsg('user', text);
    history.push({ role: 'user', content: text });

    setBusy(true);
    const botEl = appendMsg('bot', '', true); // typing indicator
    const bubble = botEl.querySelector('.patita-bubble');

    let fullText = '';

    try {
      const res = await fetch('/api/patita', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: history.slice(0, -1), // all turns except the one just pushed
        }),
      });

      if (!res.ok) {
        bubble.innerHTML = `<span class="patita-error">Error ${res.status} — intenta de nuevo</span>`;
        setBusy(false);
        return;
      }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      bubble.innerHTML = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.error) {
              bubble.innerHTML = `<span class="patita-error">${escHTML(data.error)}</span>`;
            } else if (data.text) {
              fullText += data.text;
              bubble.innerHTML = toHTML(fullText);
              messagesEl.scrollTop = messagesEl.scrollHeight;
            }
          } catch {}
        }
      }

      history.push({ role: 'assistant', content: fullText });

    } catch (err) {
      bubble.innerHTML = `<span class="patita-error">Error de conexión: ${escHTML(err.message)}</span>`;
    }

    setBusy(false);
    inputEl.focus();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  function appendMsg(role, text, typing = false) {
    const el = document.createElement('div');
    el.className = `patita-msg patita-msg--${role}`;

    const avatar = role === 'bot' ? '<img src="/img/patita.jpg" alt="PatitaPM" class="patita-avatar-img">' : '👤';
    const content = typing
      ? '<div class="patita-typing"><span></span><span></span><span></span></div>'
      : `<div class="patita-bubble">${toHTML(text)}</div>`;

    el.innerHTML = `<div class="patita-avatar">${avatar}</div><div class="patita-bubble">${
      typing ? '<div class="patita-typing"><span></span><span></span><span></span></div>' : toHTML(text)
    }</div>`;

    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return el;
  }

  function toHTML(text) {
    return escHTML(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/^#{1,3} (.+)$/gm, '<strong>$1</strong>')
      .replace(/^[-•] (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
      .replace(/\n{2,}/g, '</p><p>')
      .replace(/\n/g, '<br>');
  }

  function escHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function setBusy(val) {
    busy = val;
    sendBtn.disabled = val;
    sendBtn.textContent = val ? '…' : '↑';
  }

  function clearChat() {
    history = [];
    messagesEl.innerHTML = '';
    const el = document.createElement('div');
    el.className = 'patita-msg patita-msg--bot';
    el.innerHTML = `<div class="patita-avatar"><img src="/img/patita.jpg" alt="PatitaPM" class="patita-avatar-img"></div><div class="patita-bubble"><p>Chat limpiado. ¿En qué te puedo ayudar?</p></div>`;
    messagesEl.appendChild(el);
  }
})();
