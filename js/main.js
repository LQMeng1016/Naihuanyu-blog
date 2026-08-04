/* ===== 拾光 × 素笺 · 交互逻辑 =====
   主题切换（6 套配色 × 深浅模式，localStorage 记忆）
   调色板面板开关 / 回到顶部 */

(function () {
  'use strict';

  var THEME_KEY = 'shiguang_theme',   // 记录所选主题
      MODE_KEY = 'shiguang_mode';     // 记录深浅模式
  var body = document.body;

  /* ---------- 应用主题 / 模式 ---------- */
  function applyTheme(t) {
    body.dataset.theme = t;
    try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
    var swatches = document.querySelectorAll('.swatch');
    for (var i = 0; i < swatches.length; i++) {
      swatches[i].classList.toggle('active', swatches[i].dataset.theme === t);
    }
  }

  function applyMode(m) {
    body.classList.toggle('dark', m === 'dark');
    var sw = document.getElementById('mode-switch');
    if (sw) sw.classList.toggle('dark-mode', m === 'dark');
    try { localStorage.setItem(MODE_KEY, m); } catch (e) {}
  }

  /* ---------- 初始化：恢复上次选择（默认 抹茶绿 + 深色） ---------- */
  var savedTheme = null, savedMode = null;
  try {
    savedTheme = localStorage.getItem(THEME_KEY);
    savedMode = localStorage.getItem(MODE_KEY);
  } catch (e) {}
  applyTheme(savedTheme || 'matcha');
  applyMode(savedMode || 'dark');

  /* ---------- 调色板面板开关 ---------- */
  var panel = document.getElementById('panel');
  var paletteBtn = document.getElementById('palette-btn');
  if (panel && paletteBtn) {
    paletteBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      panel.classList.toggle('open');
    });
    document.addEventListener('click', function (e) {
      if (!panel.contains(e.target) && e.target.id !== 'palette-btn') {
        panel.classList.remove('open');
      }
    });
  }

  /* ---------- 色卡点击切换主题 ---------- */
  var swatches = document.querySelectorAll('.swatch');
  for (var i = 0; i < swatches.length; i++) {
    swatches[i].addEventListener('click', function () {
      applyTheme(this.dataset.theme);
    });
  }

  /* ---------- 深浅切换 ---------- */
  var modeSwitch = document.getElementById('mode-switch');
  if (modeSwitch) {
    modeSwitch.addEventListener('click', function () {
      applyMode(body.classList.contains('dark') ? 'light' : 'dark');
    });
  }

  /* ---------- 每板块最多展示 3 张课程卡 + 1 张「更多」= 刚好两排，超出自动折叠 ---------- */
  var cardsBoxes = document.querySelectorAll('.cards');
  for (var b = 0; b < cardsBoxes.length; b++) {
    var box = cardsBoxes[b];
    var cards = box.querySelectorAll('.card');
    if (cards.length > 3) {
      for (var c = 3; c < cards.length; c++) {
        cards[c].style.display = 'none';
      }
      var more = document.createElement('a');
      more.className = 'card';
      more.href = 'course.html';
      more.style.cssText = 'display:flex;flex-direction:column;justify-content:center;align-items:center;gap:4px;border-style:dashed;';
      more.innerHTML = '<div class="c-name">更多课程</div><div class="c-desc">查看该类别全部课程 →</div>';
      box.appendChild(more);
    }
  }

  /* ---------- 侧边导航：当前区块高亮 ---------- */
  var secs = document.querySelectorAll('section[id]');
  var sideLinks = document.querySelectorAll('.side-nav a');
  if (secs.length && sideLinks.length) {
    function highlightNav() {
      var pos = window.scrollY + 140;
      var current = secs[0].id;
      for (var i = 0; i < secs.length; i++) {
        if (secs[i].offsetTop <= pos) current = secs[i].id;
      }
      for (var j = 0; j < sideLinks.length; j++) {
        sideLinks[j].classList.toggle('active', sideLinks[j].getAttribute('href') === '#' + current);
      }
    }
    window.addEventListener('scroll', highlightNav);
    highlightNav();
  }

  /* ---------- 回到顶部 ---------- */
  var topBtn = document.getElementById('to-top');
  if (topBtn) {
    window.addEventListener('scroll', function () {
      topBtn.classList.toggle('show', window.scrollY > 400);
    });
    topBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
})();
