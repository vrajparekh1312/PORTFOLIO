/* ====================================================
   VRAJ PAREKH PORTFOLIO — script.js
   ==================================================== */

/* ── GLOBAL VARIABLES ── */
var logoClicks = 0;
var logoTimer = null;
var savedTheme = localStorage.getItem('theme');
var isDark = savedTheme ? (savedTheme === 'dark') : true;
document.body.classList.toggle('light', !isDark);
var termHistory = [];
var termHistIdx = -1;
var selectedChoice = null;

/* ── PERFORMANCE UTILITIES ── */
function rafThrottle(fn) {
  var ticked = false;
  return function () {
    var args = arguments;
    var context = this;
    if (!ticked) {
      window.requestAnimationFrame(function () {
        fn.apply(context, args);
        ticked = false;
      });
      ticked = true;
    }
  };
}

var cachedRects = new Map();
function getCachedRect(el) {
  if (!cachedRects.has(el)) {
    cachedRects.set(el, el.getBoundingClientRect());
  }
  return cachedRects.get(el);
}
function clearRectCache() {
  cachedRects.clear();
}
window.addEventListener('resize', rafThrottle(clearRectCache));
window.addEventListener('scroll', rafThrottle(clearRectCache));

/* ── JOURNEY DRAG SCROLL ── */
window.addEventListener('load', function () {
  var themeBtn = document.getElementById('theme-btn');
  if (themeBtn) themeBtn.textContent = isDark ? '☀️' : '🌙';
  var track = document.getElementById('htl-track');
  if (track) {
    var isDown = false, startX, scrollLeft;
    track.addEventListener('mousedown', function(e) {
      isDown = true; track.style.cursor = 'grabbing';
      startX = e.pageX - track.offsetLeft;
      scrollLeft = track.scrollLeft;
    });
    track.addEventListener('mouseleave', function() { isDown = false; track.style.cursor = ''; });
    track.addEventListener('mouseup', function() { isDown = false; track.style.cursor = ''; });
    track.addEventListener('mousemove', function(e) {
      if (!isDown) return;
      e.preventDefault();
      var x = e.pageX - track.offsetLeft;
      var walk = (x - startX) * 1.4;
      track.scrollLeft = scrollLeft - walk;
    });
  }

  /* ── TIMELINE LINE POSITION ── */
  /* Measure actual dot center offset relative to .htl-outer and set the line layer top */
  function positionTimelineLine() {
    var outer = document.querySelector('.htl-outer');
    var lineLayer = document.getElementById('htl-line-layer');
    var firstDot = document.querySelector('.htl-dot');
    if (!outer || !lineLayer || !firstDot) return;
    var outerRect = outer.getBoundingClientRect();
    var dotRect = firstDot.getBoundingClientRect();
    // Center of dot relative to htl-outer top
    var dotCenterY = (dotRect.top - outerRect.top) + dotRect.height / 2;
    lineLayer.style.top = (dotCenterY - 1.5) + 'px'; // -1.5 = half of 3px line height
  }
  // Run after a short delay to let layout settle, and on resize
  setTimeout(positionTimelineLine, 300);
  window.addEventListener('resize', rafThrottle(positionTimelineLine));
});

/* ── LOADER ── */
(function () {
  var STEPS = [
    'Booting System...',
    'Loading AI...',
    'Ready.'
  ];
  var STEP_PCT = [0, 33, 66, 100];
  var stepIdx = 0, charIdx = 0;
  var pct = 0, targetPct = 0;
  var aiShown = false, exitTriggered = false;
  var bar     = document.getElementById('ld-bar');
  var barGlow = document.getElementById('ld-bar-glow');
  var pctEl   = document.getElementById('ld-pct');
  var textEl  = document.getElementById('ld-text');
  var aiEl    = document.getElementById('ld-ai');

  /* smooth eased progress — fast start, slows near each milestone, crawls at 95%+ */
  setInterval(function () {
    if (pct >= targetPct) return;
    var diff = targetPct - pct;
    /* buttery smooth: micro jitter removed via tiny noise floor */
    var speed = pct >= 95
      ? Math.max(diff * 0.03, 0.12) + (Math.random() * 0.04)
      : Math.max(diff * 0.06, 0.4);
    pct = Math.min(pct + speed, targetPct);
    var w = pct.toFixed(2) + '%';
    bar.style.width = w;
    barGlow.style.width = w;
    pctEl.textContent = Math.floor(pct) + '%';
    /* dim background at 95% — focus attention on bar + AI */
    if (pct >= 95 && !document.getElementById('loader').style.background.includes('020305')) {
      document.getElementById('loader').style.transition = 'background 0.6s ease';
      document.getElementById('loader').style.background = '#020305';
    }
    if (!aiShown && pct >= 82)  { aiShown = true; aiEl.classList.add('visible'); }
    if (!exitTriggered && pct >= 97) {
      exitTriggered = true;
      aiEl.style.transition = 'opacity 0.2s ease';
      aiEl.style.opacity = '0';
      setTimeout(function () {
        document.getElementById('loader').classList.add('out');
        initThree();
        initParticles();
        /* show hints after loader fades — 3-4s visible window */
        setTimeout(function () {
          var devHint = document.getElementById('dev-hint-bubble');
          var termHint = document.getElementById('term-hint-bubble');
          /* position term hint directly below the ⌨️ button */
          var termBtn = document.querySelector('.icon-btn[onclick="openTerminal()"]');
          if (termHint && termBtn) {
            var r = termBtn.getBoundingClientRect();
            termHint.style.top = (r.bottom + 10) + 'px';
            termHint.style.left = (r.left + r.width / 2) + 'px';
            termHint.style.right = 'auto';
            termHint.style.transform = 'translateX(-50%) translateY(-6px)';
            termHint.style.transition = 'opacity .5s ease, transform .5s ease';
          }
          if (devHint) devHint.classList.add('hint-show');
          if (termHint) termHint.classList.add('hint-show');
          /* hide after 4s */
          setTimeout(function () {
            if (devHint) { devHint.classList.remove('hint-show'); setTimeout(function(){ devHint.remove(); }, 600); }
            if (termHint) { termHint.classList.remove('hint-show'); setTimeout(function(){ termHint.remove(); }, 600); }
          }, 4000);
        }, 800);
      }, 300);
    }
  }, 30);

  /* typing — each step appends a new line; previous lines dim */
  function typeStep() {
    if (stepIdx >= STEPS.length) return;
    var word = STEPS[stepIdx];
    if (charIdx === 0) {
      targetPct = STEP_PCT[stepIdx];
      var line = document.createElement('div');
      line.className = 'ld-step-line ld-step-active';
      line.innerHTML = '<span class="ld-prompt">sys://</span><span class="ld-step-text"></span>';
      textEl.appendChild(line);
      var all = textEl.querySelectorAll('.ld-step-line');
      for (var i = 0; i < all.length - 1; i++) {
        all[i].classList.remove('ld-step-active');
        all[i].classList.add('ld-step-done');
      }
    }
    var activeText = textEl.querySelector('.ld-step-active .ld-step-text');
    if (charIdx <= word.length) {
      activeText.textContent = word.slice(0, charIdx);
      charIdx++;
      setTimeout(typeStep, 42);
    } else {
      targetPct = STEP_PCT[stepIdx + 1];
      setTimeout(function () { stepIdx++; charIdx = 0; typeStep(); }, 175);
    }
  }

  /* 120ms boot delay before first step */
  setTimeout(typeStep, 120);
})();

/* ── THREE.JS FLOATING 3D GEOMETRY ── */
function initThree() {
  var cv = document.getElementById('three-cv');
  if (!cv || typeof THREE === 'undefined') return;

  var renderer = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 12;

  scene.add(new THREE.AmbientLight(0x334466, 0.8));
  var pl1 = new THREE.PointLight(0x4fa3ff, 2, 30);
  pl1.position.set(8, 5, 5);
  scene.add(pl1);
  var pl2 = new THREE.PointLight(0xa855f7, 1.5, 25);
  pl2.position.set(-8, -5, 3);
  scene.add(pl2);

  var geoList = [
    new THREE.OctahedronGeometry(0.65, 0), new THREE.TetrahedronGeometry(0.75, 0),
    new THREE.IcosahedronGeometry(0.55, 0), new THREE.BoxGeometry(0.8, 0.8, 0.8),
    new THREE.OctahedronGeometry(0.45, 0), new THREE.IcosahedronGeometry(0.7, 0),
    new THREE.TetrahedronGeometry(0.6, 0), new THREE.BoxGeometry(0.65, 0.65, 0.65),
    new THREE.OctahedronGeometry(0.5, 0), new THREE.TetrahedronGeometry(0.55, 0)
  ];
  var colorList = [0x4fa3ff, 0xa855f7, 0x06d6a0, 0xfbbf24, 0x4fa3ff, 0xa855f7, 0x06d6a0, 0xf43f5e, 0x4fa3ff, 0xa855f7];

  var shapes = geoList.map(function (geo, i) {
    var mat = new THREE.MeshPhongMaterial({ color: colorList[i], wireframe: true, opacity: 0.22, transparent: true });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set((Math.random() - 0.5) * 24, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 6 - 4);
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    mesh.userData = { vx: (Math.random() - 0.5) * 0.003, vy: (Math.random() - 0.5) * 0.003, rx: (Math.random() - 0.5) * 0.008, ry: (Math.random() - 0.5) * 0.009 };
    scene.add(mesh);
    return mesh;
  });

  var mousX = 0, mousY = 0;
  document.addEventListener('mousemove', function (e) {
    mousX = (e.clientX / window.innerWidth - 0.5) * 2;
    mousY = (e.clientY / window.innerHeight - 0.5) * 2;
  });
  window.addEventListener('resize', rafThrottle(function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }));

  function animThree() {
    requestAnimationFrame(animThree);
    shapes.forEach(function (s) {
      s.position.x += s.userData.vx; s.position.y += s.userData.vy;
      s.rotation.x += s.userData.rx; s.rotation.y += s.userData.ry;
      if (Math.abs(s.position.x) > 13) s.userData.vx *= -1;
      if (Math.abs(s.position.y) > 8) s.userData.vy *= -1;
    });
    camera.position.x += (mousX * 0.5 - camera.position.x) * 0.04;
    camera.position.y += (-mousY * 0.3 - camera.position.y) * 0.04;
    renderer.render(scene, camera);
  }
  animThree();
}

/* ── PARTICLES ── */
function initParticles() {
  var pCv = document.getElementById('p-cv');
  if (!pCv) return;
  var pCtx = pCv.getContext('2d');
  var pts = [];

  function resizeP() { pCv.width = window.innerWidth; pCv.height = window.innerHeight; }
  resizeP();
  window.addEventListener('resize', rafThrottle(resizeP));

  for (var i = 0; i < 70; i++) {
    pts.push({ x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight, vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25, r: Math.random() * 1.4 + 0.5, c: Math.random() > 0.5 ? '79,163,255' : '168,85,247' });
  }

  function drawP() {
    pCtx.clearRect(0, 0, pCv.width, pCv.height);
    pts.forEach(function (p) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = pCv.width; if (p.x > pCv.width) p.x = 0;
      if (p.y < 0) p.y = pCv.height; if (p.y > pCv.height) p.y = 0;
      pCtx.beginPath(); pCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      pCtx.fillStyle = 'rgba(' + p.c + ',.45)'; pCtx.fill();
    });
    for (var i = 0; i < pts.length; i++) {
      for (var j = i + 1; j < pts.length; j++) {
        var dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < 110) {
          pCtx.beginPath(); pCtx.moveTo(pts[i].x, pts[i].y); pCtx.lineTo(pts[j].x, pts[j].y);
          pCtx.strokeStyle = 'rgba(79,163,255,' + (0.07 * (1 - d / 110)) + ')'; pCtx.stroke();
        }
      }
    }
    requestAnimationFrame(drawP);
  }
  drawP();
}

/* ── CUSTOM CURSOR ── */
var cur = document.getElementById('cur');
var curO = document.getElementById('cur-o');
var cx = 0, cy = 0, ox = 0, oy = 0;

document.addEventListener('mousemove', function (e) {
  cx = e.clientX; cy = e.clientY;
  cur.style.left = cx + 'px'; cur.style.top = cy + 'px';
});

(function animCur() {
  ox += (cx - ox) * 0.12; oy += (cy - oy) * 0.12;
  curO.style.left = ox + 'px'; curO.style.top = oy + 'px';
  requestAnimationFrame(animCur);
})();

document.querySelectorAll('a, button, .pj-card').forEach(function (el) {
  el.addEventListener('mouseenter', function () { document.body.classList.add('cb'); });
  el.addEventListener('mouseleave', function () { document.body.classList.remove('cb'); });
});

/* ── SCROLL PROGRESS ── */
window.addEventListener('scroll', rafThrottle(function () {
  var s = document.documentElement.scrollTop || document.body.scrollTop;
  var h = document.documentElement.scrollHeight - window.innerHeight;
  var pg = document.getElementById('pg');
  if (pg && h > 0) pg.style.width = (s / h * 100) + '%';
}));

/* ── REVEAL ON SCROLL ── */
var revObs = new IntersectionObserver(function (entries) {
  entries.forEach(function (e) { if (e.isIntersecting) e.target.classList.add('on'); });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(function (r) { revObs.observe(r); });

/* ── SKILL BARS ── */
var skObs = new IntersectionObserver(function (entries) {
  entries.forEach(function (e) {
    if (e.isIntersecting) {
      e.target.querySelectorAll('.sk-fill').forEach(function (b) { b.style.width = b.dataset.w + '%'; });
    }
  });
}, { threshold: 0.3 });
document.querySelectorAll('.sk-card').forEach(function (c) { skObs.observe(c); });

/* ── STATS COUNTER ── */
var stObs = new IntersectionObserver(function (entries) {
  entries.forEach(function (e) {
    if (e.isIntersecting) {
      e.target.querySelectorAll('[data-count]').forEach(function (el) {
        var target = parseInt(el.dataset.count);
        var suf = el.dataset.suffix || '';
        var c = 0, inc = target / 60;
        var tm = setInterval(function () {
          c += inc;
          if (c >= target) { c = target; clearInterval(tm); }
          el.textContent = Math.floor(c) + suf;
        }, 25);
      });
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('.stats-inner').forEach(function (s) { stObs.observe(s); });

/* ── TYPING ANIMATION ── */
var words = ['Software Developer', 'AI Enthusiast', 'CVMU Hackathon Winner', 'Problem Solver', 'Full-Stack Engineer'];
var wi = 0, ci = 0, deleting = false;
var typEl = document.getElementById('typing-text');

function renderTypedText(text) {
  typEl.innerHTML = text.split('').map(function(ch, idx) {
    return '<span style="--i:' + idx + '">' + (ch === ' ' ? '&nbsp;' : ch) + '</span>';
  }).join('');
}

function type() {
  var w = words[wi];
  if (!deleting) {
    renderTypedText(w.slice(0, ++ci));
    if (ci === w.length) { deleting = true; setTimeout(type, 1800); return; }
  } else {
    renderTypedText(w.slice(0, --ci));
    if (ci === 0) { deleting = false; wi = (wi + 1) % words.length; }
  }
  setTimeout(type, deleting ? 45 : 75);
}
type();

/* ── 3D PROFILE CARD TILT ── */
var c3d = document.getElementById('card3d');
if (c3d) {
  var wrap3d = c3d.parentElement;
  wrap3d.addEventListener('mousemove', function (e) {
    var r = getCachedRect(wrap3d);
    var x = (e.clientX - r.left - r.width / 2) / (r.width / 2);
    var y = (e.clientY - r.top - r.height / 2) / (r.height / 2);
    c3d.style.transform = 'rotateY(' + (x * 12) + 'deg) rotateX(' + (-y * 10) + 'deg)';
  });
  wrap3d.addEventListener('mouseleave', function () { c3d.style.transform = ''; });
}

/* ── PROJECT CARD MOUSE GLOW ── */
function pjGlow(e, el) {
  var r = getCachedRect(el);
  el.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
  el.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
}

/* ── RIPPLE EFFECT ── */
function addRipple(e, btn) {
  var rp = document.createElement('span');
  rp.className = 'ripple';
  var rect = btn.getBoundingClientRect();
  var size = Math.max(rect.width, rect.height) * 2;
  rp.style.cssText = 'width:' + size + 'px;height:' + size + 'px;left:' + (e.clientX - rect.left - size / 2) + 'px;top:' + (e.clientY - rect.top - size / 2) + 'px';
  btn.appendChild(rp);
  setTimeout(function () { rp.remove(); }, 700);
}

/* ── THEME TOGGLE ── */
function toggleTheme() {
  isDark = !isDark;
  document.body.classList.toggle('light', !isDark);
  document.getElementById('theme-btn').textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  
  // Re-sync with Dev panel checkbox
  var chk = document.getElementById('dark-light-toggle');
  if (chk) chk.checked = !isDark;
  
  // Reapply custom accents if active
  if (localStorage.getItem('devPanelUnlocked') === 'true') {
    applyAccentColors();
  }
}

/* ── MOBILE NAV ── */
function toggleMobNav() {
  document.getElementById('mob-nav').classList.toggle('open');
  document.getElementById('ham').classList.toggle('open');
}

/* ── SMOOTH SCROLL ── */
function scrollToSection(id) {
  var el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

/* ── RESUME DOWNLOAD ── */
function dlResume() {
  alert('Resume download coming soon!\nVisit: linkedin.com/in/vraj-parekh-7b801b30b');
}

/* ── CONTACT FORM ── */
function handleForm(btn) {
  var name = document.querySelector('.ct-form input[type="text"]').value.trim();
  var email = document.querySelector('.ct-form input[type="email"]').value.trim();
  var msg = document.querySelector('.ct-form textarea').value.trim();

  if (!name || !email || !msg) {
    var old = btn.textContent;
    btn.textContent = '⚠ Please fill all fields';
    btn.style.background = 'linear-gradient(135deg,#f43f5e,#be123c)';
    setTimeout(function () {
      btn.textContent = old;
      btn.style.background = '';
      btn.disabled = false;
    }, 2000);
    return;
  }

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    var old2 = btn.textContent;
    btn.textContent = '⚠ Invalid email address';
    btn.style.background = 'linear-gradient(135deg,#f43f5e,#be123c)';
    setTimeout(function () {
      btn.textContent = old2;
      btn.style.background = '';
      btn.disabled = false;
    }, 2000);
    return;
  }

  btn.textContent = 'OPENING EMAIL CLIENT…';
  btn.disabled = true;

  var subject = encodeURIComponent('Portfolio Contact from ' + name);
  var body = encodeURIComponent(
    'Hi Vraj,\n\nName: ' + name +
    '\nEmail: ' + email +
    '\n\nMessage:\n' + msg +
    '\n\n---\nSent via vrajparekh.dev portfolio'
  );
  var mailto = 'mailto:vraj13122005@gmail.com?subject=' + subject + '&body=' + body;

  // Use window.open to trigger native email client reliably
  var link = document.createElement('a');
  link.href = mailto;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Also update the Gmail fallback button with form data
  var gmailBtn = document.getElementById('form-gmail-btn');
  if (gmailBtn) {
    var gmailUrl = 'https://mail.google.com/mail/?view=cm&fs=1&to=vraj13122005@gmail.com' +
      '&su=' + subject +
      '&body=' + body;
    gmailBtn.href = gmailUrl;
  }

  setTimeout(function () {
    btn.textContent = '✓ EMAIL CLIENT OPENED!';
    btn.style.background = 'linear-gradient(135deg,#06d6a0,#059669)';
    // Show a visible success toast
    showFormToast('✅ Your email client has opened with the message pre-filled. Please hit Send!');
    // Clear the form
    document.querySelector('.ct-form input[type="text"]').value = '';
    document.querySelector('.ct-form input[type="email"]').value = '';
    document.querySelector('.ct-form textarea').value = '';
    setTimeout(function () {
      btn.textContent = 'SEND MESSAGE →';
      btn.style.background = '';
      btn.disabled = false;
    }, 4000);
  }, 400);
}

function showFormToast(message) {
  var existing = document.getElementById('form-toast');
  if (existing) existing.remove();
  var toast = document.createElement('div');
  toast.id = 'form-toast';
  toast.style.cssText = [
    'position:fixed',
    'bottom:1.5rem',
    'left:50%',
    'transform:translateX(-50%) translateY(80px)',
    'background:linear-gradient(135deg,rgba(6,214,160,.15),rgba(6,214,160,.08))',
    'border:1px solid rgba(6,214,160,.45)',
    'color:#e8eef8',
    'font-family:var(--font-m)',
    'font-size:.78rem',
    'padding:.8rem 1.5rem',
    'border-radius:100px',
    'z-index:9999',
    'box-shadow:0 8px 32px rgba(0,0,0,.3)',
    'text-align:center',
    'max-width:90vw',
    'transition:transform .4s cubic-bezier(.34,1.56,.64,1),opacity .4s',
    'opacity:0'
  ].join(';');
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      toast.style.transform = 'translateX(-50%) translateY(0)';
      toast.style.opacity = '1';
    });
  });
  setTimeout(function () {
    toast.style.transform = 'translateX(-50%) translateY(80px)';
    toast.style.opacity = '0';
    setTimeout(function () { toast.remove(); }, 500);
  }, 5000);
}

document.addEventListener('DOMContentLoaded', function () {
  var contactForm = document.getElementById('contact-form');
  if (!contactForm) return;
  contactForm.addEventListener('submit', function (event) {
    event.preventDefault();
    submitContactForm(contactForm);
  });
});

function submitContactForm(form) {
  var name = form.querySelector('input[name="name"]').value.trim();
  var email = form.querySelector('input[name="email"]').value.trim();
  var message = form.querySelector('textarea[name="message"]').value.trim();
  var responseEl = document.getElementById('form-response');
  var submitBtn = document.getElementById('form-btn');

  if (responseEl) {
    responseEl.textContent = '';
    responseEl.className = 'form-response';
  }

  if (!name || !email || !message) {
    if (responseEl) {
      responseEl.textContent = 'Please complete all fields before sending.';
      responseEl.classList.add('error');
    }
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    if (responseEl) {
      responseEl.textContent = 'Please enter a valid email address.';
      responseEl.classList.add('error');
    }
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'SENDING...';
  }

  var formData = new FormData(form);
  fetch(form.action, {
    method: 'POST',
    body: formData,
    headers: { 'Accept': 'application/json' }
  }).then(function (response) {
    if (response.ok) {
      if (responseEl) {
        responseEl.textContent = '✅ Message sent successfully. I’ll get back to you soon!';
        responseEl.classList.add('success');
      }
      form.reset();
      if (submitBtn) submitBtn.textContent = 'SENT!';
      setTimeout(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'SEND MESSAGE →';
        }
      }, 3000);
      return;
    }
    return response.json().then(function (data) {
      throw new Error(data.error || 'Submission failed. Please try again.');
    });
  }).catch(function (error) {
    if (responseEl) {
      responseEl.textContent = '⚠️ ' + error.message;
      responseEl.classList.add('error');
    }
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'SEND MESSAGE →';
    }
  });
}

/* ── PROJECT MODALS ── */
var MODALS = {
  cs: {
    tag: { cls: 'tag-w', text: '🏆 CVMU Hackathon Winner · 2024' },
    title: 'CitySolve', sub: 'Smart Civic Issue Reporting Platform — 1st Place, CVMU 4.0',
    overview: 'CitySolve bridges citizens and government through real-time civic issue reporting with GPS-tagged photos, authority dashboards, and live status tracking.',
    features: [
      '<b>Civic Issue Reporting</b>: GPS-tagged complaint submission with real-time photo uploads (tested with 150+ mock reports).',
      '<b>Authority Dashboard</b>: Government management portal that reduced resolution assignment time by 40%.',
      '<b>Milestone Hackathon Win</b>: Awarded 1st place out of 80+ competing teams at CVMU 4.0 Hackathon.',
      '<b>Scalable Integration</b>: Built as a Kotlin companion app connected to a MongoDB backend and Express.js REST API.'
    ],
    stack: ['HTML', 'CSS', 'JavaScript', 'Node.js', 'Express.js', 'MongoDB', 'Kotlin'],
    live: 'https://citysolve.me/'
  },
  infer: {
    tag: { cls: 'tag-a', text: '🤖 AI · Enterprise · SIH 2025' },
    title: 'Infer@', sub: 'AI Document Intelligence for Kochi Metro Rail (KMRL)',
    overview: 'Infer@ automates extraction and structuring of information from complex documents using OCR and AI — built for KMRL at Smart India Hackathon 2025.',
    features: [
      '<b>High-Accuracy OCR</b>: Achieved 97.4% accuracy parsing complex structural engineering documents & tables.',
      '<b>Layout Analysis Pipeline</b>: Utilized OpenCV for intelligent section segmentation and tabular grid extraction.',
      '<b>Large-Scale Processing</b>: Tested on 10,000+ pages of construction documents and blueprints for Kochi Metro Rail (KMRL).',
      '<b>Enterprise API Integration</b>: Custom Express API routes to pipe data securely to internal database servers.'
    ],
    stack: ['Python', 'OpenCV', 'Tesseract OCR', 'Node.js', 'Express.js', 'MongoDB'],
    live: 'https://inferat-official.vercel.app/'
  },
  hc: {
    tag: { cls: 'tag-a', text: '🌿 AI · Healthcare' },
    title: 'HerbCure', sub: 'AI-Powered Herbal Medicine Detection and Recommendation',
    overview: 'HerbCure uses OCR and AI to identify herbal medicines and provide intelligent alternative recommendations — making traditional herbal knowledge accessible.',
    features: [
      '<b>Species Identification</b>: Recognizes 50+ herb species from mobile camera scans using custom AI classifiers.',
      '<b>Tesseract OCR Engine</b>: Achieved 94% accuracy reading active ingredients and chemical profiles on medicine labels.',
      '<b>Alternative Recommendation Engine</b>: Provides natural remedies and alternative recommendations in < 2 seconds.',
      '<b>Practitioner Database</b>: Built a comprehensive, searchable knowledge base of active herbal components.'
    ],
    stack: ['Python', 'Tesseract OCR', 'AI/ML', 'HTML', 'CSS', 'JavaScript', 'Node.js'],
    live: null
  },
  em: {
    tag: { cls: 'tag-e', text: '⛏️ Sustainability · AI' },
    title: 'EnviroMine', sub: 'Coal Mine Emission Analyzer and Sustainability Platform',
    overview: 'EnviroMine helps coal mining operations understand, track, and reduce their environmental footprint through AI-driven analysis and actionable sustainability recommendations.',
    features: [
      '<b>Carbon Footprint Calculation</b>: Tracks greenhouse gas emissions from complex mining operations with 98% accuracy.',
      '<b>AI Reduction Strategies</b>: Automatically generates tailored mitigation plans that reduce footprint predictions by 25%.',
      '<b>Sustainability Scoring</b>: Renders interactive charts comparing company progress with state climate benchmarks.',
      '<b>Reporting Tools</b>: Outputs formatted PDF environmental impact reports for compliance reviews.'
    ],
    stack: ['HTML', 'CSS', 'JavaScript', 'Node.js', 'AI Analysis'],
    live: 'https://enviromine.netlify.app/'
  },
  kc: {
    tag: { cls: 'tag-a', text: '🎓 Internship · E-Learning' },
    title: 'KidsCode', sub: 'Gamified E-Learning Platform — HP Param IT Solutions',
    overview: 'KidsCode is a gamified e-learning platform designed to teach children programming basics (Python, JS, HTML, CSS, SQL, Scratch) with lessons, quizzes, and parent controls.',
    features: [
      '<b>Gamified Track & Streak Engine</b>: Features interactive courses for 5+ languages with streak recovery mechanics.',
      '<b>Parent Controls & Time Limits</b>: Configurable screen limits and weekly progress reports sent automatically to parents.',
      '<b>NoSQL Injection Shield</b>: Implemented global middleware input validation ensuring 100% protection against injection exploits.',
      '<b>Brevo OTP System</b>: Implemented secure passwordless signup/login using transactional email verification APIs.'
    ],
    stack: ['Node.js', 'Express', 'MongoDB', 'HTML5', 'CSS3', 'JavaScript'],
    live: 'https://kids-code-lyart.vercel.app/',
    github: 'https://github.com/vrajparekh1312/KidsCode'
  },
  ca: {
    tag: { cls: 'tag-b', text: '🚀 Internship · Frontend' },
    title: 'CodeAlpha Internship', sub: 'Frontend Development Projects & Tasks',
    overview: 'A series of front-end applications developed during the Frontend Development Internship at CodeAlpha, designed with responsive layouts and interactive features.',
    features: [
      '<b>Responsive Calculator</b>: Supports full arithmetic operation flow with clean layout and decimal calculations.',
      '<b>MELO Music Player</b>: Interactive web player featuring play/pause, volume control, track progress bar, and zero latency playback.',
      '<b>Portfolio Website</b>: Designed a modern responsive layout to display projects and resume details.'
    ],
    stack: ['HTML5', 'CSS3', 'JavaScript (ES6)'],
    lives: [
      { name: 'Calculator Live', url: 'https://vrajparekh1312.github.io/CodeAlpha_Calculator/' },
      { name: 'MELO Live', url: 'https://vrajparekh1312.github.io/CodeAlpha_MusicPlayer/' },
      { name: 'Portfolio Live', url: 'https://vrajparekh1312.github.io/CodeAlpha_Portfolio/' }
    ],
    github: 'https://github.com/vrajparekh1312/codealpha'
  }
};

function openModal(key) {
  var d = MODALS[key];
  if (!d) return;
  var featHTML = d.features.map(function (f) { return '<li>' + f + '</li>'; }).join('');
  var stackHTML = d.stack.map(function (s) { return '<span class="modal-pill">' + s + '</span>'; }).join('');
  var liveBtn = '';
  if (d.lives) {
    liveBtn = d.lives.map(function (l) {
      return '<a href="' + l.url + '" target="_blank" class="btn btn-p" style="text-decoration:none;font-size:.8rem;background:linear-gradient(135deg,var(--teal),#059669)">🌐 ' + l.name + ' ↗</a>';
    }).join('');
  } else if (d.live) {
    liveBtn = '<a href="' + d.live + '" target="_blank" class="btn btn-p" style="text-decoration:none;font-size:.8rem;background:linear-gradient(135deg,var(--teal),#059669)">🌐 Live Demo ↗</a>';
  }
  var githubUrl = d.github || 'https://github.com/vrajparekh1312';
  document.getElementById('modal-content').innerHTML =
    '<div class="modal-tag ' + d.tag.cls + '">' + d.tag.text + '</div>' +
    '<h2 class="modal-title">' + d.title + '</h2>' +
    '<p class="modal-sub">' + d.sub + '</p>' +
    '<div class="modal-sec"><h4>Overview</h4><p style="font-size:.84rem;color:var(--t2);line-height:1.85">' + d.overview + '</p></div>' +
    '<div class="modal-sec"><h4>Key Features</h4><ul class="modal-feat-list">' + featHTML + '</ul></div>' +
    '<div class="modal-sec"><h4>Tech Stack</h4><div class="modal-stack">' + stackHTML + '</div></div>' +
    '<div style="display:flex;gap:.8rem;margin-top:1.4rem;flex-wrap:wrap">' +
    liveBtn +
    '<a href="' + githubUrl + '" target="_blank" class="btn btn-p" style="text-decoration:none;font-size:.8rem">GitHub ↗</a>' +
    '<button class="btn btn-g" style="font-size:.8rem" onclick="closeModal()">Close</button></div>';
  document.getElementById('modal-ov').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal-ov').classList.remove('open');
  document.body.style.overflow = '';
}

function closeModalBg(e) {
  if (e.target === document.getElementById('modal-ov')) closeModal();
}

/* ── KEYBOARD SHORTCUTS ── */
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') { closeModal(); closeDev(); closeTerm(); }
  if ((e.ctrlKey || e.metaKey) && e.key === '`') { e.preventDefault(); openTerminal(); }
});

var AI_KB = {
  projects: "Vraj's major portfolio projects:<br><br>" +
    "• 🏆 <b>CitySolve</b> — CVMU 4.0 Hackathon Winner. Real-time civic issue reporting with GPS, image uploads, and dashboard. Stack: Node.js · MongoDB · Kotlin.<br>" +
    "• 🤖 <b>Infer@</b> — SIH 2025 project for Kochi Metro Rail. AI document intelligence utilizing OCR &amp; layout detection. Stack: Python · OpenCV · Tesseract.<br>" +
    "• 🧩 <b>KidsCode</b> — HP Param IT Solutions internship. Gamified programming learning for kids with XP, parent controls, OTP login. Stack: Node.js · Express · MongoDB.<br>" +
    "• 🌿 <b>HerbCure</b> — Scan herbs via OCR to get AI-powered alternative medicine recommendations. Stack: Python · Tesseract · AI/ML.<br>" +
    "• ⛏️ <b>EnviroMine</b> — Coal mine emission calculator and AI sustainability strategies. Stack: Node.js · JavaScript.",
  skills: "Technical Skills:<br><br>" +
    "• 💻 <b>Languages &amp; AI:</b> Python · Java · JavaScript · C · Gemini API · LangChain (Ongoing)<br>" +
    "• 🌐 <b>Frontend:</b> HTML5 · CSS3 · React · Next.js · Tailwind CSS<br>" +
    "• 🗄️ <b>Backend &amp; DB:</b> Node.js · Express.js · REST APIs · MongoDB · MySQL · Firebase<br>" +
    "• ☁️ <b>Cloud &amp; DevOps:</b> Google Cloud (GCP) &amp; AWS<br>" +
    "• 🤖 <b>Other:</b> Full-Stack Development · AI/ML Integration",
  achievements: "Key Achievements:<br><br>" +
    "• 🏆 <b>1st Place</b> — CVMU 4.0 Hackathon (with CitySolve)<br>" +
    "• 🚇 <b>Smart India Hackathon 2025</b> — Developed AI system for Kochi Metro Rail (KMRL)<br>" +
    "• ☁️ <b>4 Cloud Certifications</b> — 3 Google Cloud &amp; 1 AWS Academy graduate<br>" +
    "• 📊 <b>Academic Performance:</b> CPI: 9.24 / 10",
  certifications: "Cloud &amp; Tech Certifications (4 total):<br><br>" +
    "• ☁️ <b>AWS Academy Graduate — Cloud Foundations</b> (Amazon Web Services, Feb 2026)<br>" +
    "• 🟡 <b>Google Cloud Foundations: Infrastructure in Google Cloud</b> (Google Cloud, Oct 2023)<br>" +
    "• 🟡 <b>Google Cloud Foundations: Cloud Computing Fundamentals</b> (Google Cloud, Oct 2023)<br>" +
    "• 🤖 <b>Level 3 GenAI: Prompt Engineering</b> (Google Cloud, Oct 2023)",
  hackathons: "Hackathon Experience:<br><br>" +
    "• 🏆 <b>CVMU 4.0 Hackathon (1st Place Winner):</b> Conceptualized and built <b>CitySolve</b>, a real-time civic issue reporting platform with GPS verification and dashboard tracking.<br>" +
    "• 🚇 <b>Smart India Hackathon (SIH) 2025:</b> Developed <b>Infer@</b>, an AI-powered document intelligence system tailored for Kochi Metro Rail (KMRL) to perform OCR and layout analysis.",
  resume: "<b>Vraj Parekh's Resume</b><br><br>" +
    "• Full-Stack Developer<br>" +
    "• CVMU 4.0 Hackathon Winner<br>" +
    "• SIH 2025 Participant<br>" +
    "• 4 Cloud Certifications (3 Google Cloud &amp; 1 AWS)<br><br>" +
    "👉 <a href=\"#\" onclick=\"dlResume();return false;\" style=\"color:var(--neon);text-decoration:underline;font-weight:bold\">Download Resume</a><br>" +
    "👉 <a href=\"https://www.linkedin.com/in/vraj-parekh-7b801b30b\" target=\"_blank\" style=\"color:var(--neon);text-decoration:underline;font-weight:bold\">View LinkedIn</a><br>" +
    "👉 <a href=\"#\" onclick=\"scrollToSection('contact');toggleAI();return false;\" style=\"color:var(--neon);text-decoration:underline;font-weight:bold\">Contact Vraj</a>",
  contact: "Feel free to reach out to Vraj Parekh:<br><br>" +
    "• 📧 <b>Email:</b> <a href=\"mailto:vraj13122005@gmail.com\" style=\"color:var(--neon);text-decoration:underline\">vraj13122005@gmail.com</a><br>" +
    "• 💼 <b>LinkedIn:</b> <a href=\"https://www.linkedin.com/in/vraj-parekh-7b801b30b\" target=\"_blank\" style=\"color:var(--neon);text-decoration:underline\">linkedin.com/in/vraj-parekh-7b801b30b</a><br>" +
    "• 🐙 <b>GitHub:</b> <a href=\"https://github.com/vrajparekh1312\" target=\"_blank\" style=\"color:var(--neon);text-decoration:underline\">github.com/vrajparekh1312</a><br><br>" +
    "You can also use the contact form at the bottom of the page! 👇",
  education: "Education Details:<br><br>" +
    "• 🎓 <b>B.Tech in Computer Engineering</b><br>" +
    "&nbsp;&nbsp;Madhuben &amp; Bhanubhai Patel Institute of Technology (MBIT), CVM University<br>" +
    "&nbsp;&nbsp;Academic CPI: <b>9.24 / 10</b><br>" +
    "• 🏫 Secondary Education with strong Science foundation.",
  def: "I can tell you about Vraj's <b>projects</b>, <b>skills</b>, <b>achievements</b>, <b>certifications</b>, <b>hackathons</b>, <b>resume</b>, or <b>contact</b> info. What would you like to know? 😊"
};

function matchAI(q) {
  var l = q.toLowerCase();
  if (/citysol/.test(l)) return "🏆 <b>CitySolve</b> won 1st place at CVMU 4.0 Hackathon! Citizens report civic issues with GPS+photos. Stack: Node.js · MongoDB · Kotlin.";
  if (/infer/.test(l)) return "🤖 <b>Infer@</b> — AI document intelligence for KMRL (SIH 2025). OCR + layout detection. Stack: Python · OpenCV · Tesseract.";
  if (/herb/.test(l)) return "🌿 <b>HerbCure</b> — Scan herbs via OCR, get AI-powered medicine alternatives. Stack: Python · Tesseract · AI/ML.";
  if (/enviro|mine/.test(l)) return "⛏️ <b>EnviroMine</b> — Calculate coal mine emissions, get AI reduction strategies. Stack: Node.js · JavaScript.";
  if (/kidscode|kids|elearning/.test(l)) return "🧩 <b>KidsCode</b> — Gamified e-learning platform for children to learn programming, built during HP Param IT Solutions internship. Features XP/streaks, parent controls, and passwordless OTP. Stack: Node.js · Express · MongoDB.";
  if (/codealpha|calculator|melo/.test(l)) return "🚀 <b>CodeAlpha Internship</b> — Vraj completed 3 frontend tasks: 1) responsive Calculator, 2) MELO Music Player with audio controls, and 3) Personal Portfolio. Stack: HTML5 · CSS3 · JS.";
  if (/project|build/.test(l)) return AI_KB.projects;
  if (/skill|tech|python|java|node/.test(l)) return AI_KB.skills;
  if (/achiev|award/.test(l)) return AI_KB.achievements;
  if (/cert/.test(l)) return AI_KB.certifications;
  if (/hackathon|sih|cvmu/.test(l)) return AI_KB.hackathons;
  if (/resume|cv|download/.test(l)) return AI_KB.resume;
  if (/contact|email|phone|linkedin|github|hire/.test(l)) return AI_KB.contact;
  if (/edu|college|cpi/.test(l)) return AI_KB.education;
  if (/hi|hello|hey/.test(l)) return "Hey! 👋 Ask me about Vraj's <b>projects</b>, <b>skills</b>, <b>education</b>, or how to <b>hire him</b>!";
  if (/who|vraj|about/.test(l)) return "Vraj Ashokbhai Parekh — CE student at MBIT (CPI: 9.24), AI developer, full-stack engineer, CVMU 4.0 CVMU Hackathon Winner! 🚀";
  return AI_KB.def;
}

function toggleAI() {
  var win = document.getElementById('ai-win');
  var opening = !win.classList.contains('open');
  win.classList.toggle('open');
  if (opening) {
    var flash = document.createElement('div');
    flash.className = 'ai-flash';
    document.body.appendChild(flash);
    setTimeout(function () { flash.remove(); }, 450);
  }
}

function sendAI() {
  var inp = document.getElementById('ai-inp');
  var q = inp.value.trim();
  if (!q) return;
  var box = document.getElementById('ai-msgs');
  var um = document.createElement('div');
  um.className = 'ai-usr'; um.textContent = q; box.appendChild(um);
  inp.value = ''; box.scrollTop = box.scrollHeight;
  var t = document.createElement('div');
  t.className = 'ai-bot typing';
  t.innerHTML = '<span style="font-size:.74rem;color:var(--t2);margin-right:.5rem">VP.AI is typing...</span><span class="tdot"></span><span class="tdot"></span><span class="tdot"></span>';
  box.appendChild(t); box.scrollTop = box.scrollHeight;
  setTimeout(function () {
    t.remove();
    var bm = document.createElement('div'); bm.className = 'ai-bot'; bm.innerHTML = matchAI(q);
    box.appendChild(bm); box.scrollTop = box.scrollHeight;
  }, 650 + Math.random() * 400);
}

function sendAISuggest(q) {
  var inp = document.getElementById('ai-inp');
  if (inp) {
    inp.value = q;
    sendAI();
  }
}

/* ── EASTER EGG — DEVELOPER MODE (logo ×5) ── */
var CHALLENGES = [
  {
    title: '🐛 CHALLENGE 1: Debug the Python Function',
    code: [
      { n: '1', t: 'def add_numbers(a, b):' },
      { n: '2', t: '    result = a <span class="code-error">-</span> b&nbsp;&nbsp;<span style="color:rgba(0,255,65,.35)"># Bug here!</span>' },
      { n: '3', t: '    return result' }, { n: '4', t: '' },
      { n: '5', t: 'print(add_numbers(5, 3))&nbsp;&nbsp;<span style="color:rgba(0,255,65,.35)"># Expects 8</span>' }
    ],
    question: '❓ The function should ADD two numbers but outputs 2 instead of 8. What is the bug?',
    choices: [
      { text: 'A) The function name is wrong', correct: false },
      { text: 'B) Line 2 uses subtraction (-) instead of addition (+)', correct: true },
      { text: 'C) The return statement is missing', correct: false },
      { text: 'D) print() should be console.log()', correct: false }
    ]
  },
  {
    title: '🐛 CHALLENGE 2: Fix the JavaScript Loop',
    code: [
      { n: '1', t: 'let sum = 0;' },
      { n: '2', t: 'for (let i = 1; i &lt;= 5; <span class="code-error">i--</span>) {&nbsp;&nbsp;<span style="color:rgba(0,255,65,.35)">// Bug!</span>' },
      { n: '3', t: '    sum += i;' }, { n: '4', t: '}' },
      { n: '5', t: 'console.log(sum);&nbsp;&nbsp;<span style="color:rgba(0,255,65,.35)">// Should print 15</span>' }
    ],
    question: '❓ This loop runs forever. What is the bug on line 2?',
    choices: [
      { text: 'A) sum should be initialized to 1', correct: false },
      { text: 'B) The condition should use < not <=', correct: false },
      { text: 'C) i-- should be i++ (wrong direction)', correct: true },
      { text: 'D) console.log should be inside the loop', correct: false }
    ]
  },
  {
    title: '🐛 CHALLENGE 3: Spot the SQL Bug',
    code: [
      { n: '1', t: 'SELECT name, age' }, { n: '2', t: 'FROM users' },
      { n: '3', t: '<span class="code-error">WHER</span> age &gt; 18;&nbsp;&nbsp;<span style="color:rgba(0,255,65,.35)">-- Bug here!</span>' }
    ],
    question: '❓ This SQL query throws a syntax error. What is wrong on line 3?',
    choices: [
      { text: 'A) age should be quoted as "age"', correct: false },
      { text: 'B) FROM should come after WHERE', correct: false },
      { text: 'C) WHER is misspelled — should be WHERE', correct: true },
      { text: 'D) The semicolon should be removed', correct: false }
    ]
  }
];

function handleLogoClick() {
  logoClicks++;
  var remaining = 5 - logoClicks;
  var cc = document.getElementById('click-counter');
  if (remaining > 0) {
    cc.textContent = '🔓 ' + logoClicks + '/5 — ' + remaining + ' more click' + (remaining > 1 ? 's' : '') + ' to unlock Dev Mode';
    cc.classList.add('show');
    if (logoTimer) clearTimeout(logoTimer);
    logoTimer = setTimeout(function () { cc.classList.remove('show'); logoClicks = 0; }, 3000);
  } else {
    cc.classList.remove('show'); logoClicks = 0;
    if (logoTimer) clearTimeout(logoTimer);
    launchDevMode();
  }
}

function launchDevMode() {
  selectedChoice = null;
  var overlay = document.getElementById('dev-overlay');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  var body = document.getElementById('dev-body');
  body.innerHTML = '';

  var challenge = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
  var lines = [
    { text: '<span class="dev-prompt">system@portfolio:~$</span> <span class="dev-cmd">sudo unlock --developer-mode</span>', delay: 0 },
    { text: '<span class="dev-warn">⚡ Developer mode detected...</span>', delay: 400 },
    { text: '<span class="dev-info">▶ Scanning portfolio architecture...</span>', delay: 800 },
    { text: '<span class="dev-info">▶ Verifying developer credentials...</span>', delay: 1200 },
    { text: '<span class="dev-warn">🔐 Access requires proof of developer knowledge.</span>', delay: 1600 },
    { text: '<span class="dev-prompt">system@portfolio:~$</span> <span class="dev-cmd">load --challenge debug_mode</span>', delay: 2100 },
    { text: '<span class="dev-success">✓ Debug challenge loaded. Can you find the bug?</span>', delay: 2500 }
  ];

  lines.forEach(function (item) {
    setTimeout(function () {
      var el = document.createElement('div');
      el.className = 'dev-line'; el.innerHTML = item.text;
      body.appendChild(el); body.scrollTop = body.scrollHeight;
    }, item.delay);
  });

  setTimeout(function () {
    var codeRows = challenge.code.map(function (l) {
      return '<div><span class="line-num">' + l.n + '</span>' + l.t + '</div>';
    }).join('');
    var choiceRows = challenge.choices.map(function (c) {
      return '<button class="dev-choice" onclick="selectChoice(this,' + c.correct + ')">' + c.text + '</button>';
    }).join('');
    var ch = document.createElement('div');
    ch.className = 'dev-challenge dev-line';
    ch.innerHTML =
      '<div class="dev-challenge-title">' + challenge.title + '</div>' +
      '<div class="dev-code-block">' + codeRows + '</div>' +
      '<div class="dev-q">' + challenge.question + '</div>' +
      '<div class="dev-choices" id="dev-choices">' + choiceRows + '</div>' +
      '<button class="dev-submit" id="dev-submit" onclick="submitChallenge()" disabled>[ SUBMIT ANSWER ]</button>' +
      '<div id="dev-result" style="margin-top:.8rem;font-size:.76rem;min-height:1rem"></div>';
    body.appendChild(ch); body.scrollTop = body.scrollHeight;
  }, 2800);
}

function selectChoice(btn, isCorrect) {
  document.querySelectorAll('.dev-choice').forEach(function (b) {
    b.classList.remove('correct', 'wrong'); b.style.pointerEvents = 'auto';
  });
  btn.classList.add(isCorrect ? 'correct' : 'wrong');
  selectedChoice = isCorrect;
  document.getElementById('dev-submit').disabled = false;
}

function submitChallenge() {
  var resultEl = document.getElementById('dev-result');
  var submitBtn = document.getElementById('dev-submit');
  if (selectedChoice === true) {
    playSuccessSound();
    resultEl.innerHTML = '<span class="dev-success">✓ CORRECT! Access granted. Loading reward...</span>';
    submitBtn.disabled = true;
    document.querySelectorAll('.dev-choice').forEach(function (b) { b.style.pointerEvents = 'none'; });
    setTimeout(function () { closeDev(); showReward(); }, 1200);
  } else {
    playSynthSound(150, 'sawtooth', 0.2);
    resultEl.innerHTML = '<span class="dev-error">✗ Incorrect. Study the code carefully and try again.</span>';
    submitBtn.disabled = true;
    document.querySelectorAll('.dev-choice').forEach(function (b) { b.classList.remove('correct', 'wrong'); b.style.pointerEvents = 'auto'; });
    selectedChoice = null;
    setTimeout(function () { submitBtn.disabled = false; resultEl.innerHTML = ''; }, 1500);
  }
}

function closeDev() {
  document.getElementById('dev-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

function closeDevBg(e) {
  if (e.target === document.getElementById('dev-overlay')) closeDev();
}

function showReward() {
  document.getElementById('reward-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  spawnConfetti();
}

function closeReward() {
  document.getElementById('reward-overlay').classList.remove('open');
  document.body.style.overflow = '';
  unlockDevPanel();
}

function spawnConfetti() {
  var container = document.getElementById('reward-confetti');
  container.innerHTML = '';
  var colors = ['#00ff41', '#4fa3ff', '#a855f7', '#fbbf24', '#f43f5e', '#06d6a0'];
  for (var i = 0; i < 60; i++) {
    var el = document.createElement('div');
    var color = colors[Math.floor(Math.random() * colors.length)];
    var size = Math.random() * 8 + 4;
    var isCircle = Math.random() > 0.5;
    el.style.cssText = 'position:absolute;width:' + size + 'px;height:' + size + 'px;background:' + color + ';border-radius:' + (isCircle ? '50%' : '2px') + ';left:' + (Math.random() * 100) + '%;top:-10px;animation:confettiFall ' + (1.5 + Math.random() * 2) + 's ease ' + (Math.random() * 0.8) + 's forwards;opacity:0';
    container.appendChild(el);
  }
  if (!document.getElementById('confetti-style')) {
    var s = document.createElement('style');
    s.id = 'confetti-style';
    s.textContent = '@keyframes confettiFall{0%{opacity:1;transform:translateY(0) rotate(0deg)}100%{opacity:0;transform:translateY(400px) rotate(720deg)}}';
    document.head.appendChild(s);
  }
}

/* ── HACKER TERMINAL (Ctrl+~ or nav button) ── */
var TERM_CMDS = {
  help: function () {
    return '<div class="tc-amber">Available commands:</div>' +
      '<div>&nbsp;&nbsp;<span class="tc-blue">about</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;— About Vraj Parekh</div>' +
      '<div>&nbsp;&nbsp;<span class="tc-blue">skills</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;— Technical skills list</div>' +
      '<div>&nbsp;&nbsp;<span class="tc-blue">projects</span>&nbsp;&nbsp;&nbsp;— List all projects</div>' +
      '<div>&nbsp;&nbsp;<span class="tc-blue">achievements</span> — Awards &amp; certifications</div>' +
      '<div>&nbsp;&nbsp;<span class="tc-blue">contact</span>&nbsp;&nbsp;&nbsp;&nbsp;— Contact information</div>' +
      '<div>&nbsp;&nbsp;<span class="tc-blue">resume</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;— Download resume</div>' +
      '<div>&nbsp;&nbsp;<span class="tc-blue">clear</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;— Clear terminal</div>' +
      '<div>&nbsp;&nbsp;<span class="tc-blue">exit</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;— Close terminal</div>';
  },
  about: function () {
    return '<div class="tc-green">Vraj Ashokbhai Parekh</div>' +
      '<div>Role&nbsp;&nbsp;&nbsp;&nbsp; : Computer Engineering Student</div>' +
      '<div>College&nbsp;&nbsp; : MBIT, CVM University</div>' +
      '<div>CPI&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; : <span class="tc-amber">9.24</span></div>' +
      '<div>Location : Gujarat, India</div>' +
      '<div>Status&nbsp;&nbsp;&nbsp; : <span class="tc-green">Available for opportunities ✓</span></div>';
  },
  skills: function () {
    return '<div class="tc-violet">── LANGUAGES &amp; AI ──</div>' +
      '<div>Python | Java | JavaScript | C | Gemini API | LangChain (Ongoing)</div>' +
      '<div class="tc-violet">── FRONTEND ──</div>' +
      '<div>HTML/CSS | React | Next.js | Tailwind CSS | UI/UX</div>' +
      '<div class="tc-violet">── BACKEND / MERN ──</div>' +
      '<div>Node.js | Express | MERN Stack | REST APIs</div>' +
      '<div class="tc-violet">── DATABASES &amp; CLOUD ──</div>' +
      '<div>MongoDB | MySQL | Firebase | Google Cloud (GCP) &amp; AWS</div>';
  },
  projects: function () {
    return '<div class="tc-amber">🏆 CitySolve</div><div>&nbsp;&nbsp;&nbsp;Smart Civic Issue Reporting Platform — CVMU 4.0 Hackathon Winner</div>' +
      '<div class="tc-blue">🤖 Infer@</div><div>&nbsp;&nbsp;&nbsp;AI Document Intelligence for Kochi Metro Rail (SIH 2025)</div>' +
      '<div class="tc-green">🌿 HerbCure</div><div>&nbsp;&nbsp;&nbsp;AI Herbal Medicine Detection &amp; Recommendations</div>' +
      '<div class="tc-violet">⛏️ EnviroMine</div><div>&nbsp;&nbsp;&nbsp;Coal Mine Emission Analyzer &amp; Sustainability Platform</div>' +
      '<div class="tc-teal">🧩 KidsCode</div><div>&nbsp;&nbsp;&nbsp;Gamified E-Learning Platform — HP Param IT Solutions Internship</div>' +
      '<div class="tc-neon">🚀 CodeAlpha</div><div>&nbsp;&nbsp;&nbsp;Frontend Development Internship Tasks (Calculator, MELO, Portfolio)</div>';
  },
  achievements: function () {
    return '<div class="tc-amber">🏆 1st Place — CVMU 4.0 Hackathon (2024)</div>' +
      '<div class="tc-blue">🚇 Smart India Hackathon 2025 Participant (KMRL)</div>' +
      '<div>☁️&nbsp;&nbsp;4 Cloud Certifications (3 Google Cloud &amp; 1 AWS)</div>' +
      '<div>📊&nbsp;&nbsp;Academic CPI: <span class="tc-green">9.24/10</span></div>';
  },
  contact: function () {
    return '<div>📧 Email&nbsp;&nbsp;&nbsp;&nbsp;: <span style="color:var(--neon)">vraj13122005@gmail.com</span></div>' +
      '<div>🐙 GitHub&nbsp;&nbsp;&nbsp;: <span class="tc-violet">github.com/vrajparekh1312</span></div>' +
      '<div>💼 LinkedIn : <span class="tc-blue">linkedin.com/in/vraj-parekh-7b801b30b</span></div>';
  },
  resume: function () {
    setTimeout(function () { dlResume(); }, 100);
    return '<span class="tc-amber">Triggering resume download...</span>';
  },
  clear: function () { document.getElementById('term-output').innerHTML = ''; return null; },
  exit: function () { setTimeout(closeTerm, 300); return '<span class="tc-muted">Closing terminal...</span>'; }
};

function openTerminal() {
  document.getElementById('terminal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  playSynthSound(440, 'triangle', 0.1);
  setTimeout(function () { playSynthSound(554.37, 'triangle', 0.1); }, 80);
  setTimeout(function () { var ti = document.getElementById('term-inp'); if (ti) ti.focus(); }, 100);
}

function closeTerm() {
  document.getElementById('terminal-overlay').classList.remove('open');
  document.body.style.overflow = '';
  playSynthSound(330, 'triangle', 0.15);
}

function closeTermBg(e) {
  if (e.target === document.getElementById('terminal-overlay')) closeTerm();
}

function appendTermLine(html) {
  var out = document.getElementById('term-output');
  var d = document.createElement('div'); d.className = 'term-line'; d.innerHTML = html;
  out.appendChild(d); out.scrollTop = out.scrollHeight;
}

function appendTermHTML(html) {
  var out = document.getElementById('term-output');
  var wrapper = document.createElement('div'); wrapper.style.margin = '.2rem 0 .6rem 0';
  wrapper.innerHTML = html; out.appendChild(wrapper); out.scrollTop = out.scrollHeight;
}

function handleTermInput(e) {
  var inp = document.getElementById('term-inp');
  
  // Play keyboard sound if enabled
  if (e.key !== 'Enter' && e.key !== 'ArrowUp' && e.key !== 'ArrowDown' && e.key !== 'Tab' && e.key !== 'Escape') {
    var freq = 300 + Math.random() * 150;
    playSynthSound(freq, 'triangle', 0.03);
  }
  
  if (e.key === 'Enter') {
    var rawInput = inp.value.trim();
    if (!rawInput) return;
    termHistory.unshift(rawInput); termHistIdx = -1;
    appendTermLine('<span class="tc-green">vraj@portfolio</span><span class="tc-muted">:~$</span> ' + rawInput);
    
    // Split input into command and arguments
    var parts = rawInput.split(/\s+/);
    var cmd = parts[0].toLowerCase();
    var arg = parts.slice(1).join(' ').toLowerCase();
    
    var fn = TERM_CMDS[cmd];
    var isDevCmd = ['help-dev', 'matrix', 'inspect', 'stats', 'hire', 'theme'].indexOf(cmd) !== -1;
    var isUnlocked = localStorage.getItem('devPanelUnlocked') === 'true';
    
    if (fn && (!isDevCmd || isUnlocked)) {
      playSynthSound(700, 'triangle', 0.05);
      var out = fn(arg);
      if (out !== null && out !== undefined) appendTermHTML(out);
    } else {
      playSynthSound(150, 'sawtooth', 0.15);
      appendTermLine('<span style="color:#ff5f57">bash: ' + cmd + ": command not found. Type 'help' for commands.</span>");
    }
    inp.value = '';
  }
  if (e.key === 'ArrowUp') {
    if (termHistIdx < termHistory.length - 1) { termHistIdx++; inp.value = termHistory[termHistIdx]; }
  }
  if (e.key === 'ArrowDown') {
    if (termHistIdx > 0) { termHistIdx--; inp.value = termHistory[termHistIdx]; }
    else { termHistIdx = -1; inp.value = ''; }
  }
}

/* ── DEVELOPER CONTROL PANEL LOGIC ── */
var devPanelUnlocked = localStorage.getItem('devPanelUnlocked') === 'true';
var currentAccent = localStorage.getItem('devAccent') || 'green';
if (currentAccent === 'red') currentAccent = 'orange';
var soundEnabled = localStorage.getItem('devSound') === 'true';
var isLayoutInspecting = false;

var ACCENTS = {
  green: {
    dark:  { '--neon': '#00ff88', '--violet': '#10B981', '--teal': '#00ff88', '--gn': '0 0 40px rgba(0,255,136,.22)', '--gv': '0 0 40px rgba(16,185,129,.22)' },
    light: { '--neon': '#00a85a', '--violet': '#059669', '--teal': '#00a85a', '--gn': 'none', '--gv': 'none' }
  },
  cyan: {
    dark:  { '--neon': '#00d9ff', '--violet': '#3b82f6', '--teal': '#00d9ff', '--gn': '0 0 40px rgba(0,217,255,.22)', '--gv': '0 0 40px rgba(59,130,246,.22)' },
    light: { '--neon': '#008fa6', '--violet': '#2563eb', '--teal': '#008fa6', '--gn': 'none', '--gv': 'none' }
  },
  purple: {
    dark:  { '--neon': '#a855f7', '--violet': '#ec4899', '--teal': '#a855f7', '--gn': '0 0 40px rgba(168,85,247,.22)', '--gv': '0 0 40px rgba(236,72,153,.22)' },
    light: { '--neon': '#7c3aed', '--violet': '#db2777', '--teal': '#7c3aed', '--gn': 'none', '--gv': 'none' }
  },
  orange: {
    dark:  { '--neon': '#FFD700', '--violet': '#f59e0b', '--teal': '#FFD700', '--gn': '0 0 40px rgba(255,215,0,.22)', '--gv': '0 0 40px rgba(245,158,11,.22)' },
    light: { '--neon': '#d97706', '--violet': '#b45309', '--teal': '#d97706', '--gn': 'none', '--gv': 'none' }
  }
};

function unlockDevPanel() {
  localStorage.setItem('devPanelUnlocked', 'true');
  showDevPanelTrigger();
  setTimeout(function () {
    toggleDevPanel(true);
  }, 500);
}

function showDevPanelTrigger() {
  var bubble = document.getElementById('dev-panel-bubble');
  if (bubble) bubble.classList.add('show');
}

function toggleDevPanel(forceOpen) {
  var panel = document.getElementById('dev-panel');
  if (!panel) return;
  var isOpen = panel.classList.contains('open');
  if (forceOpen === true) {
    panel.classList.add('open');
    isOpen = true;
  } else if (forceOpen === false) {
    panel.classList.remove('open');
    isOpen = false;
  } else {
    panel.classList.toggle('open');
    isOpen = !isOpen;
  }
  
  if (isOpen) {
    syncPanelState();
  }
  playSynthSound(isOpen ? 600 : 400, 'triangle', 0.1);
}

function syncPanelState() {
  document.querySelectorAll('.dev-theme-item').forEach(function (b) {
    b.classList.remove('active');
  });
  var activeBtn = document.querySelector('.dev-theme-item.dt-' + currentAccent);
  if (activeBtn) activeBtn.classList.add('active');
  
  var statusTheme = document.getElementById('status-theme-val');
  if (statusTheme) {
    var label = 'HACKER';
    if (currentAccent === 'cyan') label = 'PROFESSIONAL DEVELOPER';
    else if (currentAccent === 'purple') label = 'CYBERPUNK';
    else if (currentAccent === 'orange') label = 'CREATIVE BUILDER';
    statusTheme.textContent = label;
  }
}

function setAccentColor(color, btn) {
  currentAccent = color;
  localStorage.setItem('devAccent', color);
  applyAccentColors();
  
  document.querySelectorAll('.dev-theme-item').forEach(function (b) {
    b.classList.remove('active');
  });
  if (btn) {
    btn.classList.add('active');
  } else {
    var target = document.querySelector('.dev-theme-item.dt-' + color);
    if (target) target.classList.add('active');
  }
  
  var statusTheme = document.getElementById('status-theme-val');
  if (statusTheme) {
    var label = 'HACKER';
    if (color === 'cyan') label = 'PROFESSIONAL DEVELOPER';
    else if (color === 'purple') label = 'CYBERPUNK';
    else if (color === 'orange') label = 'CREATIVE BUILDER';
    statusTheme.textContent = label;
  }
  
  playSynthSound(800, 'sine', 0.08);
}

function applyAccentColors() {
  var mode = isDark ? 'dark' : 'light';
  var config = ACCENTS[currentAccent] ? ACCENTS[currentAccent][mode] : null;
  if (config) {
    Object.keys(config).forEach(function (prop) {
      document.body.style.setProperty(prop, config[prop]);
    });
  }
}

function toggleLayoutInspector(checked) {
  isLayoutInspecting = checked;
  document.body.classList.toggle('layout-inspecting', checked);
  
  var statusInspect = document.getElementById('status-inspect-val');
  if (statusInspect) {
    statusInspect.textContent = checked ? 'ON' : 'OFF';
    statusInspect.className = checked ? 'tc-green' : 'tc-muted';
  }
  
  var chk = document.getElementById('layout-inspector-toggle');
  if (chk) chk.checked = checked;
  
  playSynthSound(checked ? 650 : 450, 'triangle', 0.08);
}

function toggleSoundEffects(checked) {
  soundEnabled = checked;
  localStorage.setItem('devSound', checked ? 'true' : 'false');
  
  var statusSound = document.getElementById('status-sound-val');
  if (statusSound) {
    statusSound.textContent = checked ? 'ON' : 'OFF';
    statusSound.className = checked ? 'tc-green' : 'tc-muted';
  }
  
  var chk = document.getElementById('sound-effects-toggle');
  if (chk) chk.checked = checked;
  
  if (checked) {
    playSynthSound(523.25, 'sine', 0.08);
    setTimeout(function () { playSynthSound(659.25, 'sine', 0.12); }, 80);
  } else {
    playSynthSound(330, 'sine', 0.1);
  }
}

function toggleThemeFromPanel(checked) {
  if (checked && isDark) {
    toggleTheme();
  } else if (!checked && !isDark) {
    toggleTheme();
  }
  playSynthSound(600, 'sine', 0.08);
}

function resetDevMode() {
  playSynthSound(150, 'sawtooth', 0.3);
  localStorage.removeItem('devPanelUnlocked');
  localStorage.removeItem('devAccent');
  localStorage.removeItem('devSound');
  
  var mode = isDark ? 'dark' : 'light';
  Object.keys(ACCENTS.green[mode]).forEach(function (prop) {
    document.body.style.removeProperty(prop);
  });
  
  setTimeout(function () {
    window.location.reload();
  }, 350);
}

/* ── WEB AUDIO SYNTH SOUNDS ── */
var audioCtx = null;
function playSynthSound(freq, type, duration) {
  if (!soundEnabled) return;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq || 440, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + (duration || 0.15));
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + (duration || 0.15));
  } catch (e) {
    console.warn("Web Audio failed:", e);
  }
}

function playSuccessSound() {
  setTimeout(function () { playSynthSound(523.25, 'sine', 0.12); }, 0);
  setTimeout(function () { playSynthSound(659.25, 'sine', 0.12); }, 100);
  setTimeout(function () { playSynthSound(783.99, 'sine', 0.12); }, 200);
  setTimeout(function () { playSynthSound(1046.50, 'sine', 0.25); }, 300);
}

/* ── MATRIX DIGITAL RAIN EFFECT ── */
var matrixInterval = null;
function startMatrixRain() {
  playSynthSound(880, 'sine', 0.15);
  var overlay = document.getElementById('matrix-overlay');
  var canvas = document.getElementById('matrix-canvas');
  if (!overlay || !canvas) return;
  overlay.style.display = 'block';
  var ctx = canvas.getContext('2d');
  
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  var katakana = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var alphabet = katakana.split("");
  
  var fontSize = 16;
  var columns = Math.floor(canvas.width / fontSize) + 1;
  
  var rainDrops = [];
  for (var x = 0; x < columns; x++) {
    rainDrops[x] = Math.random() * -100;
  }
  
  function draw() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    var fillStyle = '#0F0';
    if (currentAccent === 'cyan') fillStyle = '#0FF';
    else if (currentAccent === 'purple') fillStyle = '#F0F';
    else if (currentAccent === 'orange') fillStyle = '#FFD700';
    
    ctx.fillStyle = fillStyle;
    ctx.font = fontSize + 'px monospace';
    
    for (var i = 0; i < rainDrops.length; i++) {
      var text = alphabet[Math.floor(Math.random() * alphabet.length)];
      ctx.fillText(text, i * fontSize, rainDrops[i] * fontSize);
      
      if (rainDrops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        rainDrops[i] = 0;
      }
      rainDrops[i]++;
    }
  }
  
  matrixInterval = setInterval(draw, 33);
  
  function handleEsc(e) {
    if (e.key === 'Escape') {
      closeMatrixOverlay();
      window.removeEventListener('keydown', handleEsc);
    }
  }
  window.addEventListener('keydown', handleEsc);
}

function closeMatrixOverlay() {
  var overlay = document.getElementById('matrix-overlay');
  if (overlay) overlay.style.display = 'none';
  if (matrixInterval) {
    clearInterval(matrixInterval);
    matrixInterval = null;
  }
  playSynthSound(440, 'sine', 0.1);
}

/* ── ADDITIONAL DEV COMMANDS ── */
TERM_CMDS['help-dev'] = function () {
  if (localStorage.getItem('devPanelUnlocked') !== 'true') return undefined;
  return '<div class="tc-neon">Unlocked Developer Commands:</div>' +
    '<div>&nbsp;&nbsp;<span class="tc-blue">matrix</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;— falling Matrix digital rain</div>' +
    '<div>&nbsp;&nbsp;<span class="tc-blue">inspect</span>&nbsp;&nbsp;&nbsp;&nbsp;— toggle visual layout borders</div>' +
    '<div>&nbsp;&nbsp;<span class="tc-blue">stats</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;— print portfolio metrics</div>' +
    '<div>&nbsp;&nbsp;<span class="tc-blue">sound</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;— toggle retro sound effects</div>' +
    '<div>&nbsp;&nbsp;<span class="tc-blue">hire</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;— display hiring contact card</div>' +
    '<div>&nbsp;&nbsp;<span class="tc-blue">theme</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;— change accent color (theme [green|cyan|purple|orange])</div>';
};

TERM_CMDS.matrix = function () {
  if (localStorage.getItem('devPanelUnlocked') !== 'true') return undefined;
  setTimeout(startMatrixRain, 200);
  return '<span class="tc-green">Running matrix stream...</span>';
};

TERM_CMDS.inspect = function () {
  if (localStorage.getItem('devPanelUnlocked') !== 'true') return undefined;
  var currentVal = isLayoutInspecting;
  toggleLayoutInspector(!currentVal);
  return 'Layout inspector is now <span class="tc-neon">' + (!currentVal ? 'ON' : 'OFF') + '</span>.';
};

TERM_CMDS.stats = function () {
  if (localStorage.getItem('devPanelUnlocked') !== 'true') return undefined;
  var projectsCount = document.querySelectorAll('.pj-card').length;
  var skillsCount = document.querySelectorAll('.skill-item').length || 25;
  return '<div class="tc-neon">PORTFOLIO DIAGNOSTICS:</div>' +
    '<div>&nbsp;&nbsp;Projects&nbsp;&nbsp;&nbsp;: <span class="tc-green">' + projectsCount + '</span></div>' +
    '<div>&nbsp;&nbsp;Skills&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: <span class="tc-green">' + skillsCount + '</span></div>' +
    '<div>&nbsp;&nbsp;Hackathons&nbsp;: <span class="tc-green">8</span></div>';
};

TERM_CMDS.sound = function () {
  if (localStorage.getItem('devPanelUnlocked') !== 'true') return undefined;
  var currentVal = soundEnabled;
  toggleSoundEffects(!currentVal);
  return 'Sound effects are now <span class="tc-neon">' + (!currentVal ? 'ON' : 'OFF') + '</span>.';
};

TERM_CMDS.theme = function (arg) {
  if (localStorage.getItem('devPanelUnlocked') !== 'true') return undefined;
  if (!arg) {
    return 'Usage: <span class="tc-neon">theme [green|cyan|purple|orange]</span>';
  }
  if (['green', 'cyan', 'purple', 'orange'].indexOf(arg) !== -1) {
    var btn = document.querySelector('.dev-theme-item.dt-' + arg);
    setAccentColor(arg, btn);
    return 'Theme accent updated to <span class="tc-neon">' + arg.toUpperCase() + '</span>.';
  }
  return 'Invalid theme. Choose from: <span class="tc-neon">green, cyan, purple, orange</span>';
};

TERM_CMDS.hire = function () {
  if (localStorage.getItem('devPanelUnlocked') !== 'true') return undefined;
  return '<div class="tc-amber">⚡ hire vraj ashokbhai parekh ⚡</div>' +
    '<div>Email&nbsp;&nbsp;&nbsp;&nbsp;: <span style="color:var(--neon)">vraj13122005@gmail.com</span></div>' +
    '<div>LinkedIn : <span class="tc-blue">linkedin.com/in/vraj-parekh-7b801b30b</span></div>' +
    '<div>GitHub&nbsp;&nbsp;&nbsp;: <span class="tc-violet">github.com/vrajparekh1312</span></div>' +
    '<div>Status&nbsp;&nbsp;&nbsp;: <span class="tc-green">Ready for Internships &amp; FTE Positions ✓</span></div>';
};

// Initial state application
window.addEventListener('load', function () {
  if (localStorage.getItem('devPanelUnlocked') === 'true') {
    showDevPanelTrigger();
    applyAccentColors();
  }
  
  var aiInp = document.getElementById('ai-inp');
  if (aiInp) {
    aiInp.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') {
        var freq = 300 + Math.random() * 150;
        playSynthSound(freq, 'triangle', 0.03);
      }
    });
  }
});