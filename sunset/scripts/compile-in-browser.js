// http://localhost:5180 (preview.html)을 연 상태에서 브라우저 콘솔에 붙여넣어 실행하세요.
// 1) 소스의 모든 클래스 토큰을 Tailwind CDN에 보여줘 전체 CSS를 생성
// 2) Babel로 TSX → JS 컴파일
// 3) serve.ps1의 POST /__save/ 로 build/tailwind.css, build/app.js 저장
(async () => {
  const src = document.getElementById('app-src').textContent;
  const toks = [...new Set(src.split(/[\s"'`{}()<>,;=]+/).filter((t) => t && t.length < 80 && /^[!a-z0-9\-\[\]#.:%_/]+$/i.test(t)))];
  const holder = document.createElement('div');
  holder.style.display = 'none';
  for (const t of toks) {
    try { holder.classList.add(t); } catch (e) {}
  }
  document.body.appendChild(holder);
  await new Promise((r) => setTimeout(r, 1500));
  const css = [...document.querySelectorAll('style')].map((s) => s.textContent).find((t) => t.includes('--tw-')) || '';
  const js = Babel.transform(src, {
    filename: 'app.tsx',
    presets: [['typescript', { isTSX: true, allExtensions: true }], ['react', { runtime: 'classic' }], ['env', { targets: 'defaults, safari >= 14', modules: false }]],
  }).code;
  await fetch('/__save/tailwind.css', { method: 'POST', body: css });
  await fetch('/__save/app.js', { method: 'POST', body: js });
  console.log('saved build/tailwind.css', css.length, 'build/app.js', js.length, '→ 이제 scripts/build-deploy.ps1 실행');
})();
