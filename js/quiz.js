/* ===== 单词自测·打字版（测试效应：先回忆，再对照）=====
   数据源：window.WORD_DATA（JSON），范围支持 JLPT 等级与生活分类 */
(function () {
  'use strict';

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
        var nx = kana[i + 1] || '';
        var nxt = KANA[nx] || '';
        if (nxt) out += nxt[0];
        continue;
      }
      if (ch === 'ー') continue;
      var two = kana.substr(i, 2);
      if (KANA[two]) { out += KANA[two]; i++; continue; }
      out += KANA[ch] || ch;
    }
    return out;
  }

  /* ---------- 数据 ---------- */
  var words = (window.WORD_DATA || []).map(function (w) {
    var isCat = w.g && w.g.indexOf('cat:') === 0;
    return {
      jp: w.j,
      zh: w.z,
      kana: w.r || w.j,
      hasRt: !!w.r,
      romaji: kanaToRomaji(w.r || w.j),
      lvl: w.lvl || 'n5',
      isCat: isCat,
      src: w.l > 0 ? ('第' + w.l + '课') : (w.g === 'jlpt' ? '核心' : '分类')
    };
  });

  var startBtn = document.getElementById('quiz-start');
  var box = document.getElementById('quiz-box');
  var scopeSel = document.getElementById('quiz-scope');
  var countSel = document.getElementById('quiz-count');
  if (!startBtn || !box || words.length < 4) return;

  var SCOPE_LABELS = {
    all: '全部词汇', n5: 'N5', n4: 'N4', n3: 'N3', n2: 'N2', n1: 'N1', cat: '生活分类'
  };
  if (scopeSel) {
    var counts = { all: words.length, n5: 0, n4: 0, n3: 0, n2: 0, n1: 0, cat: 0 };
    words.forEach(function (w) { counts[w.lvl]++; if (w.isCat) counts.cat++; });
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
    var pool;
    if (curScope === 'all') pool = words.slice();
    else if (curScope === 'cat') pool = words.filter(function (w) { return w.isCat; });
    else pool = words.filter(function (w) { return w.lvl === curScope; });
    var want = countSel ? parseInt(countSel.value, 10) : 10;
    QUESTIONS = Math.min(want, pool.length);
    questions = shuffle(pool).slice(0, QUESTIONS);
    cur = 0; score = 0; wrongs = [];
  }

  /* ---------- 判定 ---------- */
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function rubyHTML(w) {
    return w.hasRt
      ? '<ruby>' + esc(w.jp) + '<rt>' + esc(w.kana) + '</rt></ruby>'
      : esc(w.jp);
  }
  function normZh(s) { return s.toLowerCase().replace(/[\s·、/，,。.!！?？（）()「」]/g, ''); }
  function zhWords(w) {
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
    document.getElementById('q-question').innerHTML = mode === 'jp2zh' ? rubyHTML(questions[cur]) : esc(questions[cur].zh);
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
      fb.innerHTML = '❌ 正确答案：' + rubyHTML(q) + ' = ' + esc(q.zh);
    } else {
      fb.innerHTML = '❌ 正确答案：' + rubyHTML(q) + '（罗马音：' + esc(q.romaji) + '）';
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
      fb.innerHTML = '✅ 答对啦！' + (mode === 'jp2zh' ? rubyHTML(q) + ' = ' + esc(q.zh) : esc(q.zh) + ' → ' + rubyHTML(q));
      input.disabled = true;
      document.getElementById('q-skip').style.display = 'none';
      document.getElementById('q-next').style.display = 'inline-block';
    } else {
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
          wrongs.map(function (w) { return mode === 'jp2zh' ? rubyHTML(w) + '（' + esc(w.zh) + '）' : esc(w.zh) + '（' + rubyHTML(w) + '）'; }).join('、') +
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
