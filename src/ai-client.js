(function (g) {
  'use strict';
  const key = 'salespilot-ai-connection-v1';
  function config() { try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch (_) { return {}; } }
  function validate(url) {
    const u = new URL(url);
    if (u.protocol !== 'https:' && !(u.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(u.hostname))) throw new Error('HTTPS API 주소가 필요합니다.');
    if (u.username || u.password || /[?&](?:api_?key|token|access|secret)=/i.test(u.search)) throw new Error('인증키나 비밀번호가 포함된 URL은 저장할 수 없습니다.');
    return u.href;
  }
  function getSample() {
    const initial = config();
    if (!initial.url || !initial.model) return null;
    async function call(input, options, jsonMode) {
      const c = config();
      if (!c.url || !c.model) throw new Error('AI 서버 주소와 모델명을 먼저 설정해 주세요.');
      const messages = [];
      if (input.system) messages.push({ role: 'system', content: input.system });
      if (input.messages) messages.push(...input.messages);
      else if (input.prompt) messages.push({ role: 'user', content: input.prompt });
      if (!messages.some(m => m.role === 'user')) throw new Error('AI 분석할 입력 내용이 없습니다.');
      const controller = new AbortController();
      const signal = options && options.signal || input.signal;
      const cancel = () => controller.abort();
      if (signal) { if (signal.aborted) cancel(); else signal.addEventListener('abort', cancel, { once: true }); }
      const timer = setTimeout(cancel, 90000);
      try {
        const body = { model: c.model, messages, temperature: 0.2 };
        if (input.max_tokens) body.max_tokens = input.max_tokens;
        if (jsonMode) body.response_format = { type: 'json_object' };
        const response = await fetch(validate(c.url), { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: c.cookies ? 'include' : 'omit', body: JSON.stringify(body), signal: controller.signal });
        if (!response.ok) throw new Error('AI 서버 응답 오류 (' + response.status + '). 서버 인증과 CORS 설정을 확인해 주세요.');
        const data = await response.json();
        const message = data.choices && data.choices[0] && data.choices[0].message;
        if (!message || typeof message.content !== 'string') throw new Error('OpenAI 호환 응답 형식이 아닙니다. 서버 API 문서를 확인해 주세요.');
        if (!jsonMode) return message.content;
        return JSON.parse(message.content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''));
      } catch (e) {
        if (e.name === 'AbortError') throw new Error('AI 요청이 취소되었거나 제한 시간을 넘겼습니다.');
        if (e instanceof TypeError) throw new Error('AI 서버에 접속하지 못했습니다. 주소, 네트워크, CORS 설정을 확인해 주세요.');
        throw e;
      } finally { clearTimeout(timer); if (signal) signal.removeEventListener('abort', cancel); }
    }
    return { text: (input, options) => call(input, options, false), json: (input, options) => call(input, options, true) };
  }
  function openSettings() {
    let dialog = document.getElementById('sp-ai-settings');
    if (!dialog) {
      dialog = document.createElement('dialog'); dialog.id = 'sp-ai-settings';
      dialog.style.cssText = 'max-width:560px;width:90%;border:1px solid #888;border-radius:12px;padding:24px';
      dialog.innerHTML = '<form method="dialog"><h2>기존 AI 서버 연결</h2><p>OpenAI Chat Completions 호환 중계 API의 전체 URL을 입력해 주세요. 서버에서 CORS와 인증을 처리해야 합니다. API 키는 이 사이트에 저장하지 않습니다.</p><label>API 전체 URL<input id="sp-ai-url" type="url" style="display:block;width:100%;margin:8px 0"></label><label>서버 모델명<input id="sp-ai-model" style="display:block;width:100%;margin:8px 0"></label><label><input id="sp-ai-cookies" type="checkbox"> 서버 세션 쿠키 사용(CORS 허용 필요)</label><p id="sp-ai-error" style="color:#b91c1c"></p><button type="button" id="sp-ai-save">연결 설정 저장</button> <button>닫기</button></form>';
      document.body.append(dialog);
      dialog.querySelector('#sp-ai-save').onclick = () => {
        try {
          const url = validate(dialog.querySelector('#sp-ai-url').value.trim());
          const model = dialog.querySelector('#sp-ai-model').value.trim();
          if (!model) throw new Error('서버 문서에 기재된 모델명을 입력해 주세요.');
          localStorage.setItem(key, JSON.stringify({ url, model, cookies: dialog.querySelector('#sp-ai-cookies').checked }));
          g.dispatchEvent(new Event('salespilot-ai-change')); dialog.close();
        } catch (e) { dialog.querySelector('#sp-ai-error').textContent = e.message; }
      };
    }
    const c = config();
    dialog.querySelector('#sp-ai-url').value = c.url || '';
    dialog.querySelector('#sp-ai-model').value = c.model || '';
    dialog.querySelector('#sp-ai-cookies').checked = !!c.cookies;
    dialog.querySelector('#sp-ai-error').textContent = '';
    dialog.showModal();
  }
  g.SalesPilotAI = { getSample, openSettings, configured: () => !!getSample() };
})(window);
