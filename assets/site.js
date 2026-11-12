(function () {
  'use strict';

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 언어별 문구(각 페이지가 window.SOLCHE로 넘겨 준다) ---------- */
  var T = window.SOLCHE || {};
  function t(key, fallback) { return T[key] || fallback; }

  /* ---------- 언어 메뉴: 직접 고른 언어를 이 브라우저에 기억해 둔다 ---------- */
  document.querySelectorAll('[data-lang]').forEach(function (a) {
    a.addEventListener('click', function () {
      try { localStorage.setItem('solche-lang', a.dataset.lang); } catch (e) { /* 저장을 막아 둔 브라우저 */ }
    });
  });
  document.addEventListener('click', function (e) {
    document.querySelectorAll('details.lang[open]').forEach(function (d) { if (!d.contains(e.target)) d.open = false; });
  });

  /* ---------- 첫 화면 낮/밤 ---------- */
  var heroPhone = document.getElementById('hero-phone');
  var modeBtns = document.querySelectorAll('[data-mode]');
  modeBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      heroPhone.classList.toggle('is-dark', b.dataset.mode === 'dark');
      modeBtns.forEach(function (x) {
        x.classList.toggle('on', x === b);
        x.setAttribute('aria-pressed', x === b);
      });
    });
  });

  /* ---------- 직접 써 보기: 글은 이 페이지의 메모리에만 있다 ---------- */
  var ICON = {
    pin: '<svg viewBox="0 0 24 24"><path d="M16 9V4h1V2H7v2h1v5c0 1.7-1.3 3-3 3v2h6v7l1 1 1-1v-7h6v-2c-1.7 0-3-1.3-3-3z"/></svg>',
    reply: '<svg viewBox="0 0 24 24"><path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/></svg>',
    del: '<svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>'
  };
  var feed = document.getElementById('try-feed');
  var tryForm = document.getElementById('try-form');
  var tryInput = document.getElementById('try-input');

  function iconBtn(kind, label, fn) {
    var b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = ICON[kind];
    b.setAttribute('aria-label', label);
    b.title = label;
    b.addEventListener('click', fn);
    return b;
  }
  function makePost(text, isReply) {
    var post = document.createElement('div');
    post.className = 'post';
    var ava = document.createElement('span');
    ava.className = 'ava';
    var main = document.createElement('div');
    main.className = 'main';
    var meta = document.createElement('div');
    meta.className = 'meta';
    var name = document.createElement('b');
    name.textContent = t('me', '나');
    var when = document.createElement('span');
    when.textContent = t('now', '방금 전');
    var acts = document.createElement('span');
    acts.className = 'acts';
    var body = document.createElement('p');
    body.className = 'text';
    body.textContent = text;
    meta.append(name, when, acts);
    main.append(meta, body);
    post.append(ava, main);

    if (!isReply) {
      var mark = document.createElement('span');
      mark.className = 'pin-mark';
      acts.append(iconBtn('pin', t('pin', '고정'), function () {
        var pinned = post.classList.toggle('pinned');
        if (pinned) {
          mark.textContent = t('pinned', '고정됨');
          when.after(mark);
          feed.prepend(post);
        } else {
          mark.remove();
        }
      }));
      acts.append(iconBtn('reply', t('reply', '답글'), function () {
        var open = main.querySelector('.reply-form');
        if (open) { open.querySelector('input').focus(); return; }
        var f = document.createElement('form');
        f.className = 'reply-form';
        var inp = document.createElement('input');
        inp.maxLength = 200;
        inp.placeholder = t('replyPh', '답글을 입력하세요');
        inp.setAttribute('aria-label', t('replyLabel', '답글 입력'));
        var save = document.createElement('button');
        save.className = 'btn small';
        save.textContent = t('save', '저장');
        f.append(inp, save);
        f.addEventListener('submit', function (e) {
          e.preventDefault();
          var v = inp.value.trim();
          if (!v) return;
          var box = main.querySelector('.replies');
          if (!box) {
            box = document.createElement('div');
            box.className = 'replies';
            main.insertBefore(box, f);
          }
          box.append(makePost(v, true));
          f.remove();
        });
        main.append(f);
        inp.focus();
      }));
    }
    acts.append(iconBtn('del', t('del', '삭제'), function () { post.remove(); }));
    return post;
  }
  if (feed) {
    tryForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = tryInput.value.trim();
      if (!v) return;
      feed.insertBefore(makePost(v, false), feed.querySelector(':scope > .post:not(.pinned)'));
      tryInput.value = '';
    });
    feed.append(makePost(t('sample', '어떤 날은 그냥 적어 두고 털어 버리는 게 필요해요. 답글도 달아 보세요.'), false));
  }

  /* ---------- 쓰는 법: 글에 맞춰 휴대폰 화면이 바뀐다 ---------- */
  // 장면마다 휴대폰 화면에서 강조할 영역(화면 높이 대비 %). 언어마다 글 길이가 달라 페이지가 넘겨 준다.
  var SCENES = (T.focus || [[21.5, 16.7], [24.5, 40], [22.4, 33.7], null]).map(function (f) {
    return f ? { top: f[0], height: f[1] } : null;
  });
  var sceneImgs = document.querySelectorAll('#scene-phone img');
  var focus = document.getElementById('scene-focus');
  var articles = document.querySelectorAll('[data-scene]');
  function setScene(i) {
    sceneImgs.forEach(function (im, k) { im.classList.toggle('on', k === i); });
    articles.forEach(function (a, k) { a.classList.toggle('on', k === i); });
    var stage = document.querySelector('.scene-phone');
    if (stage) stage.classList.toggle('is-desk', i === 0);
    var s = SCENES[i];
    focus.style.opacity = s ? 1 : 0;
    if (s) { focus.style.top = s.top + '%'; focus.style.height = s.height + '%'; }
  }
  if (focus) {
    var sceneIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) setScene(+e.target.dataset.scene); });
    }, { rootMargin: '-48% 0px -48% 0px' });
    articles.forEach(function (a) { sceneIO.observe(a); });
    setScene(0);
  }

  /* ---------- 기능 설명: 큰 화면에서는 옆, 좁은 화면에서는 항목 안에 화면을 둔다 ---------- */
  var feats = document.querySelectorAll('#features details');
  var featPhone = document.getElementById('feat-phone');
  var featImg = document.getElementById('feat-img');
  var featSlot = document.getElementById('feat-slot');
  var narrow = matchMedia('(max-width: 860px)');
  function placeFeat() {
    var open = document.querySelector('#features details[open]');
    if (open) {
      featImg.src = featImg.src.replace(/[^/]+$/, open.dataset.img + '.jpg');
      featImg.alt = open.querySelector('summary').textContent + t('screen', ' 화면');
    }
    if (narrow.matches && open) open.querySelector('.body').append(featPhone);
    else if (!narrow.matches) featSlot.append(featPhone);
  }
  if (featPhone) {
    feats.forEach(function (d) {
      d.addEventListener('toggle', function () {
        if (d.open) {
          feats.forEach(function (o) { if (o !== d) o.open = false; });
          placeFeat();
        }
      });
    });
    narrow.addEventListener('change', placeFeat);
    placeFeat();
  }

  /* ---------- 배경: 백야 화이트 다각형과 떨어지는 별, 꽃잎 ---------- */
  var cv = document.getElementById('sky'), ctx = cv.getContext('2d');
  var TAU = Math.PI * 2, BINS = 90;
  var W = 0, H = 0, DPR = 1;
  var mesh = document.createElement('canvas');
  var motes = [], drift = [];
  var pointer = { x: 0, y: 0, tx: 0, ty: 0, seen: false };
  var lastT = 0;

  addEventListener('mousemove', function (e) {
    pointer.tx = e.clientX; pointer.ty = e.clientY;
    if (!pointer.seen) { pointer.x = pointer.tx; pointer.y = pointer.ty; pointer.seen = true; }
  }, { passive: true });

  function rand(a, b) { return a + Math.random() * (b - a); }

  // 다각형은 움직이지 않으므로 한 번만 그려 둔다
  function buildMesh() {
    mesh.width = cv.width;
    mesh.height = cv.height;
    var m = mesh.getContext('2d');
    m.setTransform(DPR, 0, 0, DPR, 0, 0);
    m.lineWidth = .75;
    // 칸은 가로세로가 비슷해야 한다. 예전에는 폭이 좁아도 가로 7칸을 유지해서
    // 휴대폰 폭에서는 칸이 세로로 길쭉해졌다. 화면 폭에 맞춰 칸 크기를 정하고 칸 수를 센다.
    var cell = Math.max(110, Math.min(150, W / 4));
    var cols = Math.max(2, Math.round(W / cell)), rows = Math.max(2, Math.round(H / cell));
    var cw = W / cols, ch = H / rows, grid = [], r, c;
    for (r = 0; r <= rows; r++) {
      grid[r] = [];
      for (c = 0; c <= cols; c++) {
        grid[r][c] = {
          x: c * cw + (c === 0 || c === cols ? 0 : rand(-.31, .31) * cw),
          y: r * ch + (r === 0 || r === rows ? 0 : rand(-.31, .31) * ch)
        };
      }
    }
    function tri(a, b, d) {
      m.beginPath();
      m.moveTo(a.x, a.y);
      m.lineTo(b.x, b.y);
      m.lineTo(d.x, d.y);
      m.closePath();
      m.fillStyle = 'rgba(250,252,255,' + (.55 + rand(-.0225, .0225)).toFixed(3) + ')';
      m.fill();
      m.strokeStyle = 'rgba(175,206,238,.18)';
      m.stroke();
    }
    for (r = 0; r < rows; r++) {
      for (c = 0; c < cols; c++) {
        var p00 = grid[r][c], p10 = grid[r][c + 1], p01 = grid[r + 1][c], p11 = grid[r + 1][c + 1];
        if ((r + c) % 2 === 0) { tri(p00, p10, p11); tri(p00, p11, p01); }
        else { tri(p00, p10, p01); tri(p10, p11, p01); }
      }
    }
  }

  function newMote(y) {
    return {
      x: rand(0, W), y: y, vy: rand(17, 46), vx: rand(-7.5, 7.5), ph: rand(0, TAU),
      size: rand(2.6, 6.4), rot: rand(0, TAU), vr: rand(-.45, .45),
      star: Math.random() < .45, tone: Math.random()
    };
  }
  function shape(x, y, size, rot, star, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = color;
    ctx.beginPath();
    if (star) {
      for (var i = 0; i < 8; i++) {
        var rad = i % 2 ? size * .38 : size * 1.35, an = i * Math.PI / 4;
        if (i) ctx.lineTo(Math.cos(an) * rad, Math.sin(an) * rad);
        else ctx.moveTo(Math.cos(an) * rad, Math.sin(an) * rad);
      }
      ctx.closePath();
    } else {
      ctx.moveTo(0, -size * 1.25);
      ctx.quadraticCurveTo(size * .85, -size * .2, 0, size * 1.25);
      ctx.quadraticCurveTo(-size * .85, -size * .2, 0, -size * 1.25);
    }
    ctx.fill();
    ctx.restore();
  }
  function toneColor(t) {
    return t < .35 ? 'rgba(130,180,238,.52)' : t < .52 ? 'rgba(236,192,212,.48)' : 'rgba(255,255,255,.85)';
  }

  // 페이지 맨 아래에 오면 떨어진 것들이 화면 바닥에 쌓여 보인다
  function drawDrift(show) {
    var bw = W / (BINS - 1), i;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (i = 0; i < BINS; i++) ctx.lineTo(i * bw, H - drift[i] * show);
    ctx.lineTo(W, H);
    ctx.closePath();
    var g = ctx.createLinearGradient(0, H - 42, 0, H);
    g.addColorStop(0, 'rgba(205,228,252,.72)');
    g.addColorStop(1, 'rgba(245,250,255,.96)');
    ctx.fillStyle = g;
    ctx.fill();
    for (i = 1; i < BINS - 1; i += 2) {
      shape(i * bw, H - drift[i] * show + 2, 3.2 + i % 3, i * .7, i % 3 === 0,
        i % 4 === 0 ? 'rgba(232,172,196,.78)' : 'rgba(92,152,224,.72)');
    }
  }

  function draw(ms) {
    var t = (ms || 0) / 1000, dt = Math.min(.05, t - lastT);
    lastT = t;
    pointer.x += (pointer.tx - pointer.x) * .08;
    pointer.y += (pointer.ty - pointer.y) * .08;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (mesh.width && mesh.height) ctx.drawImage(mesh, 0, 0);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    var left = document.documentElement.scrollHeight - (scrollY + H);
    var show = Math.max(0, Math.min(1, 1 - left / 420));

    for (var i = 0; i < motes.length; i++) {
      var o = motes[i];
      o.y += o.vy * dt;
      o.x += (o.vx + Math.sin(t * .9 + i) * 10) * dt;
      o.rot += o.vr * dt;
      if (pointer.seen) {
        var dx = o.x - pointer.x, dy = o.y - pointer.y, dist = Math.hypot(dx, dy);
        if (dist < 110 && dist > 1) { o.x += dx / dist * 51 * dt; o.y += dy / dist * 21 * dt; }
      }
      if (o.x < -10) o.x = W + 10;
      if (o.x > W + 10) o.x = -10;
      var bin = Math.min(BINS - 1, Math.max(0, Math.floor(o.x / W * BINS)));
      if (o.y >= H - show * drift[bin]) {
        if (drift[bin] < 38) drift[bin] += .35;
        motes[i] = newMote(rand(-55, -15));
        continue;
      }
      shape(o.x, o.y, o.size, o.rot, o.star, toneColor(o.tone));
    }
    if (show > .02) drawDrift(show);

    if (!reduce) requestAnimationFrame(draw);
  }

  function resize() {
    var widthChanged = innerWidth !== W;
    W = innerWidth; H = innerHeight;
    DPR = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.round(W * DPR);
    cv.height = Math.round(H * DPR);
    buildMesh();
    if (widthChanged) {
      motes = [];
      var n = W < 700 ? 14 : 26;
      if (!reduce) for (var i = 0; i < n; i++) motes.push(newMote(rand(0, H)));
    }
  }

  for (var b = 0; b < BINS; b++) drift.push(4 + Math.sin(b / BINS * Math.PI) * 8 + rand(0, 5));

  var rt;
  addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      if (innerWidth !== W || Math.abs(innerHeight - H) > 120) {
        resize();
        if (reduce) draw(0);
      }
    }, 150);
  });

  resize();
  if (reduce) draw(0);
  else requestAnimationFrame(draw);
})();

// 메일 주소는 페이지 코드에 통째로 적지 않고 여기서 조립한다(주소 수집 프로그램 대비).
document.querySelectorAll('[data-u][data-d]').forEach(function (el) {
  var m = el.dataset.u + '@' + el.dataset.d;
  if (el.tagName === 'A') el.href = 'mailto:' + m;
  if (el.hasAttribute('data-show')) el.textContent = m;
});
