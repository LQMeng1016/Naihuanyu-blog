/* ===== 单词页 · 数据驱动渲染 =====
   Tab 三视图：按等级 / 按课次 / 生活分类
   折叠区块 + 搜索过滤 + 遮罩自测 */
(function () {
  'use strict';

  var DATA = window.WORD_DATA || [];
  var TOTAL = document.getElementById('word-total');
  if (TOTAL) TOTAL.textContent = DATA.length;

  var LVLS = [
    { key: 'n5', name: 'N5', sub: '初级入门 · 最常用' },
    { key: 'n4', name: 'N4', sub: '初级进阶' },
    { key: 'n3', name: 'N3', sub: '中级' },
    { key: 'n2', name: 'N2', sub: '中高级' },
    { key: 'n1', name: 'N1', sub: '高级' }
  ];
  var CAT_ORDER = ['水果', '月份', '星期', '时间', '数字', '颜色', '家人', '天气', '方向', '身体'];

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function ruby(j, r) {
    return r ? '<ruby>' + esc(j) + '<rt>' + esc(r) + '</rt></ruby>' : esc(j);
  }
  function srcTag(w) {
    if (w.l > 0) return '<span class="src">第' + w.l + '课</span>';
    if (w.g === 'jlpt') return '<span class="src src-jlpt">核心</span>';
    return '';
  }
  function rowHtml(w) {
    return '<tr><td class="jp">' + ruby(w.j, w.r) + '</td><td class="zh">' + esc(w.z) + '</td><td class="src-td">' + srcTag(w) + '</td></tr>';
  }
  function sectionHtml(title, sub, rows) {
    return '<h2 class="section-h foldable">' + title + '<span class="sub">' + sub + '</span><span class="fold-ico"></span></h2>' +
      '<div class="words-wrap"><table class="words-table">' +
      '<tr><th>日语</th><th>中文</th><th>来源</th></tr>' +
      rows.map(rowHtml).join('') +
      '</table></div>';
  }

  /* ---------- 三种视图数据 ---------- */
  function byLevel() {
    return LVLS.map(function (l) {
      var list = DATA.filter(function (w) { return w.lvl === l.key; })
        .sort(function (a, b) { return (a.l || 999) - (b.l || 999) || (a.j < b.j ? -1 : a.j > b.j ? 1 : 0); });
      return { key: l.key, name: l.name, sub: l.sub + ' · ' + list.length + ' 词', rows: list };
    });
  }
  function byLesson() {
    var groups = [];
    var cur = null;
    for (var i = 1; i <= 50; i++) {
      var list = DATA.filter(function (w) { return w.l === i; }).sort(function (a, b) { return a.j < b.j ? -1 : a.j > b.j ? 1 : 0; });
      if (!list.length) continue;
      var book = i <= 25 ? '初级1' : '初级2';
      if (!cur || cur.book !== book) {
        cur = { book: book, items: [] };
        groups.push(cur);
      }
      cur.items.push({ title: '第 ' + i + ' 課', sub: list.length + ' 词', rows: list });
    }
    return groups.map(function (g) {
      return {
        header: g.book === '初级1' ? '《大家的日语·初级1》第 1-25 课' : '《大家的日语·初级2》第 26-50 课',
        sections: g.items
      };
    });
  }
  function byCat() {
    return CAT_ORDER.map(function (name) {
      var list = DATA.filter(function (w) { return w.g === 'cat:' + name; })
        .sort(function (a, b) { return a.j < b.j ? -1 : a.j > b.j ? 1 : 0; });
      return { name: name, rows: list };
    }).filter(function (c) { return c.rows.length; });
  }

  /* ---------- 渲染 ---------- */
  var rendered = { jlpt: false, lesson: false, cat: false };
  function renderView(view) {
    var box = document.getElementById('view-' + view);
    if (!box) return;
    var html = '';
    if (view === 'jlpt') {
      html = byLevel().map(function (g) { return sectionHtml('📊 ' + g.name, g.sub, g.rows); }).join('');
    } else if (view === 'lesson') {
      html = byLesson().map(function (g) {
        return '<h2 class="section-h">📚 ' + g.header + '</h2>' + g.sections.map(function (s) {
          return sectionHtml(s.title, s.sub, s.rows);
        }).join('');
      }).join('');
    } else if (view === 'cat') {
      html = byCat().map(function (g) { return sectionHtml('🍎 ' + g.name, g.rows.length + ' 词', g.rows); }).join('');
    }
    box.innerHTML = html;
    rendered[view] = true;
    applyMaskState();
    initFold(box);
    if (!currentFilter) defaultFold(view, box);
  }

  function defaultFold(view, box) {
    var wraps = box.querySelectorAll('.words-wrap');
    for (var i = 0; i < wraps.length; i++) {
      var open = i === 0; // 默认只开第一区，其余折叠（页面短）
      wraps[i].classList.toggle('folded', !open);
      var h = wraps[i].previousElementSibling;
      if (h && h.classList.contains('foldable')) h.classList.toggle('folded', !open);
    }
  }

  function initFold(box) {
    var heads = box.querySelectorAll('h2.foldable');
    for (var i = 0; i < heads.length; i++) {
      heads[i].addEventListener('click', function () {
        var wrap = this.nextElementSibling;
        if (!wrap || !wrap.classList.contains('words-wrap')) return;
        var folded = !wrap.classList.contains('folded');
        wrap.classList.toggle('folded', folded);
        this.classList.toggle('folded', folded);
      });
    }
  }

  /* ---------- 搜索过滤 ---------- */
  var currentFilter = '';
  var searchInput = document.getElementById('word-search');
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      currentFilter = searchInput.value.trim().toLowerCase();
      var view = currentView;
      var box = document.getElementById('view-' + view);
      if (!currentFilter) {
        renderView(view);
        return;
      }
      var pool = DATA.filter(function (w) {
        return (w.j && w.j.toLowerCase().indexOf(currentFilter) >= 0) ||
               (w.r && w.r.toLowerCase().indexOf(currentFilter) >= 0) ||
               (w.z && w.z.toLowerCase().indexOf(currentFilter) >= 0);
      });
      var html;
      if (view === 'jlpt') {
        html = LVLS.map(function (l) {
          var list = pool.filter(function (w) { return w.lvl === l.key; });
          if (!list.length) return '';
          return sectionHtml('📊 ' + l.name, l.sub + ' · 命中 ' + list.length, list);
        }).join('');
      } else if (view === 'lesson') {
        var byL = {};
        pool.forEach(function (w) { if (w.l) (byL[w.l] = byL[w.l] || []).push(w); });
        var keys = Object.keys(byL).map(Number).sort(function (a, b) { return a - b; });
        html = keys.map(function (k) { return sectionHtml('第 ' + k + ' 課', '命中 ' + byL[k].length, byL[k]); }).join('');
      } else {
        html = CAT_ORDER.map(function (name) {
          var list = pool.filter(function (w) { return w.g === 'cat:' + name; });
          if (!list.length) return '';
          return sectionHtml('🍎 ' + name, '命中 ' + list.length, list);
        }).join('');
      }
      box.innerHTML = html || '<div class="tip-box">🔍 没有找到包含「' + esc(searchInput.value.trim()) + '」的单词</div>';
      applyMaskState();
      initFold(box);
    });
  }

  /* ---------- Tab 切换 ---------- */
  var currentView = 'jlpt';
  var tabBtns = document.querySelectorAll('.tab-btn[data-view]');
  for (var i = 0; i < tabBtns.length; i++) {
    tabBtns[i].addEventListener('click', function () {
      var view = this.dataset.view;
      if (view === currentView) return;
      currentView = view;
      for (var j = 0; j < tabBtns.length; j++) tabBtns[j].classList.remove('active');
      this.classList.add('active');
      ['jlpt', 'lesson', 'cat'].forEach(function (v) {
        document.getElementById('view-' + v).style.display = v === view ? 'block' : 'none';
      });
      if (!rendered[view]) renderView(view);
      if (searchInput && searchInput.value.trim()) searchInput.dispatchEvent(new Event('input'));
    });
  }

  /* ---------- 全部折叠 / 展开 ---------- */
  var foldAllBtn = document.getElementById('fold-all');
  var allFolded = false;
  if (foldAllBtn) {
    foldAllBtn.addEventListener('click', function () {
      allFolded = !allFolded;
      var wraps = document.querySelectorAll('.words-wrap');
      for (var i = 0; i < wraps.length; i++) {
        wraps[i].classList.toggle('folded', allFolded);
        var h = wraps[i].previousElementSibling;
        if (h && h.classList.contains('foldable')) h.classList.toggle('folded', allFolded);
      }
      foldAllBtn.textContent = allFolded ? '📂 全部展开' : '📂 全部折叠';
    });
  }

  /* ---------- 遮罩 ---------- */
  function applyMaskState() {
    var state = document.querySelector('.mask-btn.active');
    var m = state ? state.dataset.mask : 'none';
    document.querySelectorAll('.words-wrap').forEach(function (w) {
      w.classList.remove('mask-jp', 'mask-zh');
      if (m === 'jp') w.classList.add('mask-jp');
      if (m === 'zh') w.classList.add('mask-zh');
    });
  }
  var maskBtns = document.querySelectorAll('.mask-btn');
  for (var k = 0; k < maskBtns.length; k++) {
    maskBtns[k].addEventListener('click', function () {
      maskBtns.forEach(function (b) { b.classList.remove('active'); });
      this.classList.add('active');
      applyMaskState();
    });
  }

  renderView('jlpt');
})();
