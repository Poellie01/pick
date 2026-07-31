// ponytail: no Save button — `input` fires on every change, so store it there.
const DEFAULT = '#00f0ff';
const el = document.getElementById('c');
const save = (v) => chrome.storage.sync.set({ color: (el.value = v) });

chrome.storage.sync.get({ color: DEFAULT }, (v) => (el.value = v.color));
el.addEventListener('input', () => save(el.value));

// A few that read well as a glow; the native picker covers everything else.
for (const p of [DEFAULT, '#39ff14', '#ff2bd6', '#ff6b00', '#c77dff', '#ffffff']) {
  const b = document.createElement('button');
  b.style.cssText = `background:${p};box-shadow:0 0 10px ${p}`;
  b.title = p;
  b.onclick = () => save(p);
  document.querySelector('.preset').append(b);
}
