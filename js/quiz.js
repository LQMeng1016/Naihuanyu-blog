/* ===== 单词自测·打字版（测试效应：先回忆，再对照）===== */
(function () {
  'use strict';

  /* ---------- 遮罩自测：给日语列加 class，控制遮罩 ---------- */
  document.querySelectorAll('.words-table tr').forEach(function (tr) {
    var tds = tr.querySelectorAll('td');
    if (tds.length >= 2) tds[0].classList.add('jp');
  });
  var maskBtns = document.querySelectorAll('.mask-btn');
  if (maskBtns.length) {
    maskBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        maskBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var m = btn.dataset.mask;
        document.querySelectorAll('.words-wrap').forEach(function (w) {
          w.classList.remove('mask-jp', 'mask-zh');
          if (m === 'jp') w.classList.add('mask-jp');
          if (m === 'zh') w.classList.add('mask-zh');
        });
      });
    });
  }

  /* ---------- 假名 → 罗马音 ---------- */
  var KANA = {
    'あ':'a','い':'i','う':'u','え':'e','お':'o',
    'か':'ka','き':'ki','く':'ku','け':'ke','こ':'ko',
    'さ':'sa','し':'shi','す':'su','せ':'se','そ':'so',
    'た':'ta','ち':'chi','つ':'tsu','て':'te','と':'to',
    'な':'na','に':'ni','ぬ':'nu','ね':'ne','の':'no',
    'は':'ha','ひ':'hi','ふ':'fu','へ':'he','ほ':'ho',
    'ま':'ma','み':'mi','む':'mu','め':'me','も':'mo',
    'や':'ya','ゆ':'yu','よ':'yo',
    'ら':'ra','り':'ri','る':'ru','れ':'re','ろ':'ro',
    'わ':'wa','を':'o','ん':'n',
    'が':'ga','ぎ':'gi','ぐ':'gu','げ':'ge','ご':'go',
    'ざ':'za','じ':'ji','ず':'zu','ぜ':'ze','ぞ':'zo',
    'だ':'da','ぢ':'ji','づ':'zu','で':'de','ど':'do',
    'ば':'ba','び':'bi','ぶ':'bu','べ':'be','ぼ':'bo',
    'ぱ':'pa','ぴ':'pi','ぷ':'pu','ぺ':'pe','ぽ':'po',
    'きゃ':'kya','きゅ':'kyu','きょ':'kyo',
    'しゃ':'sha','しゅ':'shu','しょ':'sho',
    'ちゃ':'cha','ちゅ':'chu','ちょ':'cho',
    'にゃ':'nya','にゅ':'nyu','にょ':'nyo',
    'ひゃ':'hya','ひゅ':'hyu','ひょ':'hyo',
    'みゃ':'mya','みゅ':'myu','みょ':'myo',
    'りゃ':'rya','りゅ':'ryu','りょ':'ryo',
    'ぎゃ':'gya','ぎゅ':'gyu','ぎょ':'gyo',
    'じゃ':'ja','じゅ':'ju','じょ':'jo',
    'びゃ':'bya','びゅ':'byu','びょ':'byo',
    'ぴゃ':'pya','ぴゅ':'pyu','ぴょ':'pyo'
  };
  function kanaToRomaji(kana) {
    var out = '';
    for (var i = 0; i < kana.length; i++) {
      var ch = kana[i];
      if (ch === 'っ') {
        // 促音：双写下一个音节的首辅音
        var nx = kana[i + 1] || '';
        var nxt = KANA[nx] || '';
        if (nxt) out += nxt[0];
        continue;
      }
      if (ch === 'ー') continue; // 长音符号：判定时容错，直接忽略
      // 优先匹配双假名（拗音）
      var two = kana.substr(i, 2);
      if (KANA[two]) { out += KANA[two]; i++; continue; }
      out += KANA[ch] || ch;
    }
    return out;
  }

  /* ---------- 数据读取（按表格前一个标题自动判断所属范围） ---------- */
  var words = [];
  function scopeOf(heading) {
    if (!heading) return 'other';
    var m = heading.match(/第\s*(\d+)\s*課/);
    if (m) return parseInt(m[1], 10) <= 25 ? 'n5' : 'n4';
    if (/JLPT/.test(heading)) return 'jlpt';
    return 'cat';
  }
  document.querySelectorAll('.words-wrap').forEach(function (wrap) {
    var table = wrap.querySelector('table.words-table');
    if (!table) return;
    var h = wrap.previousElementSibling;
    while (h && h.tagName !== 'H2') h = h.previousElementSibling;
    var scope = scopeOf(h ? h.textContent : '');
    var rows = table.querySelectorAll('tr');
    for (var i = 1; i < rows.length; i++) {
      var tds = rows[i].querySelectorAll('td');
      if (tds.length < 2) continue;
      var jpHTML = tds[0].innerHTML;
      // 提取注音假名（rt 文本）；没有汉字注音时取整格假名文本
      var rts = tds[0].querySelectorAll('rt');
      var kana = '';
      if (rts.length) {
        for (var r = 0; r < rts.length; r++) kana += rts[r].textContent;
      } else {
        kana = tds[0].textContent.trim();
      }
      words.push({
        jp: jpHTML,
        zh: tds[1].textContent.trim(),
        kana: kana,
        romaji: kanaToRomaji(kana),
        scope: scope
      });
    }
  });

  var startBtn = document.getElementById('quiz-start');
  var box = document.getElementById('quiz-box');
  var scopeSel = document.getElementById('quiz-scope');
  var countSel = document.getElementById('quiz-count');
  if (!startBtn || !box || words.length < 4) return;

  // 统计各范围词数，自动刷新下拉框选项文字（加词后无需手改）
  var SCOPE_LABELS = {
    all: '全部词汇', n5: 'N5（第 1-25 课）', n4: 'N4（第 26-50 课）',
    jlpt: 'JLPT 核心词', cat: '生活分类', other: '其他'
  };
  if (scopeSel) {
    var counts = { all: words.length, n5: 0, n4: 0, jlpt: 0, cat: 0, other: 0 };
    words.forEach(function (w) { counts[w.scope]++; });
    Array.prototype.forEach.call(scopeSel.options, function (opt) {
      if (opt.value in counts) opt.textContent = SCOPE_LABELS[opt.value] + '（' + counts[opt.value] + ' 词）';
    });
  }

  var QUESTIONS = 10;
  var curScope = 'all';
  var mode = 'jp2zh';
  var questions = [];
  var cur = 0, score = 0, wrongs = [];
  var answered = false;

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function genQuiz() {
    curScope = scopeSel ? scopeSel.value : 'all';
    var pool = curScope === 'all' ? words.slice() : words.filter(function (w) { return w.scope === curScope; });
    var want = countSel ? parseInt(countSel.value, 10) : 10;
    QUESTIONS = Math.min(want, pool.length);
    questions = shuffle(pool).slice(0, QUESTIONS);
    cur = 0; score = 0; wrongs = [];
  }

  /* ---------- 判定 ---------- */
  function normZh(s) { return s.toLowerCase().replace(/[\s·、/，,。.!！?？（）()「」]/g, ''); }
  function zhWords(w) {
    // 按 / · 、 拆分多义词，忽略括号注释
    var clean = w.zh.replace(/（[^）]*）/g, '').replace(/\([^)]*\)/g, '');
    return clean.split(/[/·、\s]/).map(normZh).filter(Boolean);
  }
  function normRomaji(s) { return s.toLowerCase().replace(/[^a-z]/g, ''); }
  function collapseDup(s) { return s.replace(/([a-z])\1/g, '$1'); }

  function checkAnswer(input) {
    if (mode === 'jp2zh') {
      var inp = normZh(input);
      if (!inp) return false;
      var wordsList = zhWords(questions[cur]);
      for (var i = 0; i < wordsList.length; i++) {
        if (inp.indexOf(wordsList[i]) >= 0 || wordsList[i].indexOf(inp) >= 0) return true;
      }
      return false;
    } else {
      var want = collapseDup(normRomaji(questions[cur].romaji));
      var got = collapseDup(normRomaji(input));
      return want === got || want.indexOf(got) >= 0;
    }
  }

  /* ---------- 渲染 ---------- */
  function rebuildBox() {
    box.innerHTML =
      '<div class="quiz-head"><span>范围：' + (SCOPE_LABELS[curScope] || '全部词汇') + '</span>' +
      '<span>第 <span id="q-now">1</span> / <span id="q-total">' + QUESTIONS + '</span> 题 · 得分 <span id="q-score">0</span></span></div>' +
      '<div class="quiz-question" id="q-question"></div>' +
      '<div class="quiz-input-row"><input class="quiz-input" id="q-input" type="text" placeholder="' + (mode === 'jp2zh' ? '输入中文意思…' : '输入罗马音…') + '" autocomplete="off"><button class="quiz-btn" id="q-submit">确定</button></div>' +
      '<div class="quiz-feedback" id="q-feedback"></div>' +
      '<div class="quiz-foot">' +
      '<button class="quiz-btn" id="q-skip" style="background:var(--line);color:var(--ink);">😅 不会，看答案</button>' +
      '<button class="quiz-btn" id="q-next" style="display:none">下一题 →</button>' +
      '<button class="quiz-btn" id="q-exit" style="background:var(--line);color:var(--ink);">✖ 退出</button>' +
      '</div>';
    document.getElementById('q-total').textContent = questions.length;
    var input = document.getElementById('q-input');
    document.getElementById('q-submit').addEventListener('click', submit);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
    document.getElementById('q-skip').addEventListener('click', function () { showAnswer(true); });
    document.getElementById('q-next').addEventListener('click', next);
    document.getElementById('q-exit').addEventListener('click', exitQuiz);
  }

  function render() {
    answered = false;
    document.getElementById('q-now').textContent = cur + 1;
    document.getElementById('q-score').textContent = score;
    document.getElementById('q-question').innerHTML = mode === 'jp2zh' ? questions[cur].jp : questions[cur].zh;
    document.getElementById('q-feedback').textContent = '';
    document.getElementById('q-next').style.display = 'none';
    document.getElementById('q-skip').style.display = 'inline-block';
    var input = document.getElementById('q-input');
    input.value = '';
    input.disabled = false;
    input.focus();
  }

  function showAnswer(wasSkip) {
    if (answered) return;
    answered = true;
    var q = questions[cur];
    if (!wasSkip) wrongs.push(q);
    var fb = document.getElementById('q-feedback');
    if (mode === 'jp2zh') {
      fb.innerHTML = '❌ 正确答案：' + q.jp + ' = ' + q.zh;
    } else {
      fb.innerHTML = '❌ 正确答案：' + q.jp + '（罗马音：' + q.romaji + '）';
    }
    document.getElementById('q-input').disabled = true;
    document.getElementById('q-skip').style.display = 'none';
    document.getElementById('q-next').style.display = 'inline-block';
  }

  function submit() {
    if (answered) return;
    var input = document.getElementById('q-input');
    var val = input.value.trim();
    if (!val) { input.focus(); return; }
    var q = questions[cur];
    if (checkAnswer(val)) {
      answered = true;
      score++;
      document.getElementById('q-score').textContent = score;
      var fb = document.getElementById('q-feedback');
      fb.innerHTML = '✅ 答对啦！' + (mode === 'jp2zh' ? q.jp + ' = ' + q.zh : q.zh + ' → ' + q.jp);
      input.disabled = true;
      document.getElementById('q-skip').style.display = 'none';
      document.getElementById('q-next').style.display = 'inline-block';
    } else {
      // 输入了但不对：给一次提示，算一次错误但不用立即判死？直接判错显示答案
      wrongs.push(q);
      showAnswer(false);
    }
  }

  function next() {
    cur++;
    if (cur >= questions.length) { showResult(); } else { render(); }
  }

  function showResult() {
    box.innerHTML = '';
    var div = document.createElement('div');
    div.className = 'quiz-result';
    var pct = Math.round(score / questions.length * 100);
    var tip = pct === 100 ? '🎉 全对！太强了'
            : pct >= 80 ? '👍 很不错，继续保持'
            : pct >= 60 ? '🙂 及格了，再巩固一下'
            : '💪 别灰心，再来一轮！';
    div.innerHTML =
      '<div class="score">得分：' + score + ' / ' + questions.length + '（' + pct + '%）</div>' +
      '<div>' + tip + '</div>' +
      (wrongs.length
        ? '<div class="quiz-wrong-list">📝 错词清单：' +
          wrongs.map(function (w) { return mode === 'jp2zh' ? w.jp + '（' + w.zh + '）' : w.zh + '（' + w.jp + '）'; }).join('、') +
          '</div>'
        : '') +
      '<div class="quiz-foot">' +
      '<button class="quiz-btn" id="q-again">🔁 再来一轮</button>' +
      '<button class="quiz-btn" id="q-wrong" style="display:' + (wrongs.length ? 'inline-block' : 'none') + '">🎯 只考错词</button>' +
      '<button class="quiz-btn" id="q-exit" style="background:var(--line);color:var(--ink);">✖ 退出自测</button>' +
      '</div>';
    box.appendChild(div);
    document.getElementById('q-again').addEventListener('click', function () { genQuiz(); rebuildBox(); render(); });
    document.getElementById('q-exit').addEventListener('click', exitQuiz);
    var wrongBtn = document.getElementById('q-wrong');
    if (wrongBtn) {
      wrongBtn.addEventListener('click', function () {
        questions = shuffle(wrongs.slice());
        cur = 0; score = 0; wrongs = [];
        rebuildBox(); render();
      });
    }
  }

  function exitQuiz() {
    box.style.display = 'none';
    startBtn.style.display = 'inline-block';
  }

  startBtn.addEventListener('click', function () {
    mode = document.querySelector('input[name="qmode"]:checked').value;
    genQuiz();
    rebuildBox();
    render();
    box.style.display = 'block';
    startBtn.style.display = 'none';
  });
})();
