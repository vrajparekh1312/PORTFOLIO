/* ====================================================
   VRAJ PAREKH PORTFOLIO — script.js
   ==================================================== */

/* ── GLOBAL VARIABLES ── */
var logoClicks = 0;
var logoTimer = null;
var isDark = true;
var termHistory = [];
var termHistIdx = -1;
var selectedChoice = null;

/* ── JOURNEY DRAG SCROLL ── */
window.addEventListener('load', function () {
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
  window.addEventListener('resize', positionTimelineLine);
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
  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

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
  window.addEventListener('resize', resizeP);

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
window.addEventListener('scroll', function () {
  var s = document.documentElement.scrollTop;
  var h = document.documentElement.scrollHeight - window.innerHeight;
  document.getElementById('pg').style.width = (s / h * 100) + '%';
});

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
var words = ['Software Developer', 'AI Enthusiast', 'Hackathon Winner', 'Problem Solver', 'Full-Stack Engineer'];
var wi = 0, ci = 0, deleting = false;
var typEl = document.getElementById('typing-text');

function type() {
  var w = words[wi];
  if (!deleting) {
    typEl.textContent = w.slice(0, ++ci);
    if (ci === w.length) { deleting = true; setTimeout(type, 1800); return; }
  } else {
    typEl.textContent = w.slice(0, --ci);
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
    var r = wrap3d.getBoundingClientRect();
    var x = (e.clientX - r.left - r.width / 2) / (r.width / 2);
    var y = (e.clientY - r.top - r.height / 2) / (r.height / 2);
    c3d.style.transform = 'rotateY(' + (x * 12) + 'deg) rotateX(' + (-y * 10) + 'deg)';
  });
  wrap3d.addEventListener('mouseleave', function () { c3d.style.transform = ''; });
}

/* ── PROJECT CARD MOUSE GLOW ── */
function pjGlow(e, el) {
  var r = el.getBoundingClientRect();
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
    tag: { cls: 'tag-w', text: '🏆 Hackathon Winner · 2024' },
    title: 'CitySolve', sub: 'Smart Civic Issue Reporting Platform — 1st Place, CVMU 4.0',
    overview: 'CitySolve bridges citizens and government through real-time civic issue reporting with GPS-tagged photos, authority dashboards, and live status tracking.',
    features: ['Citizens submit complaints with GPS location and photo evidence', 'Government authority dashboard for assigning and resolving issues', 'Real-time issue tracking and resolution workflow for citizens', 'Mobile Android companion app built with Kotlin', 'Scalable MongoDB backend with Express.js REST API'],
    stack: ['HTML', 'CSS', 'JavaScript', 'Node.js', 'Express.js', 'MongoDB', 'Kotlin'],
    live: 'https://citysolve.me/'
  },
  infer: {
    tag: { cls: 'tag-a', text: '🤖 AI · Enterprise · SIH 2025' },
    title: 'Infer@', sub: 'AI Document Intelligence for Kochi Metro Rail (KMRL)',
    overview: 'Infer@ automates extraction and structuring of information from complex documents using OCR and AI — built for KMRL at Smart India Hackathon 2025.',
    features: ['OCR-based document parsing with Tesseract and pre-processing pipeline', 'Intelligent layout detection with OpenCV for structured extraction', 'Automated document type classification system', 'RESTful API for seamless KMRL system integration', 'MongoDB-backed storage with structured query interface'],
    stack: ['Python', 'OpenCV', 'Tesseract OCR', 'Node.js', 'Express.js', 'MongoDB'],
    live: 'https://inferat-official.vercel.app/'
  },
  hc: {
    tag: { cls: 'tag-a', text: '🌿 AI · Healthcare' },
    title: 'HerbCure', sub: 'AI-Powered Herbal Medicine Detection and Recommendation',
    overview: 'HerbCure uses OCR and AI to identify herbal medicines and provide intelligent alternative recommendations — making traditional herbal knowledge accessible.',
    features: ['OCR scanning of herbal medicine labels and packaging', 'AI-powered alternative medicine recommendation engine', 'Cross-comparison system for medicine properties and interactions', 'User-friendly interface for patients and practitioners', 'Comprehensive herbal medicine knowledge base'],
    stack: ['Python', 'Tesseract OCR', 'AI/ML', 'HTML', 'CSS', 'JavaScript', 'Node.js'],
    live: null
  },
  em: {
    tag: { cls: 'tag-e', text: '⛏️ Sustainability · AI' },
    title: 'EnviroMine', sub: 'Coal Mine Emission Analyzer and Sustainability Platform',
    overview: 'EnviroMine helps coal mining operations understand, track, and reduce their environmental footprint through AI-driven analysis and actionable sustainability recommendations.',
    features: ['Carbon emission calculation from operational parameters', 'AI-generated tailored reduction strategies', 'Sustainability scoring with industry benchmark comparisons', 'Detailed environmental impact reports and visualizations', 'Trend analysis for long-term emission reduction planning'],
    stack: ['HTML', 'CSS', 'JavaScript', 'Node.js', 'AI Analysis'],
    live: 'https://enviromine.netlify.app/'
  }
};

function openModal(key) {
  var d = MODALS[key];
  if (!d) return;
  var featHTML = d.features.map(function (f) { return '<li>' + f + '</li>'; }).join('');
  var stackHTML = d.stack.map(function (s) { return '<span class="modal-pill">' + s + '</span>'; }).join('');
  var liveBtn = d.live
    ? '<a href="' + d.live + '" target="_blank" class="btn btn-p" style="text-decoration:none;font-size:.8rem;background:linear-gradient(135deg,var(--teal),#059669)">🌐 Live Demo ↗</a>'
    : '';
  document.getElementById('modal-content').innerHTML =
    '<div class="modal-tag ' + d.tag.cls + '">' + d.tag.text + '</div>' +
    '<h2 class="modal-title">' + d.title + '</h2>' +
    '<p class="modal-sub">' + d.sub + '</p>' +
    '<div class="modal-sec"><h4>Overview</h4><p style="font-size:.84rem;color:var(--t2);line-height:1.85">' + d.overview + '</p></div>' +
    '<div class="modal-sec"><h4>Key Features</h4><ul class="modal-feat-list">' + featHTML + '</ul></div>' +
    '<div class="modal-sec"><h4>Tech Stack</h4><div class="modal-stack">' + stackHTML + '</div></div>' +
    '<div style="display:flex;gap:.8rem;margin-top:1.4rem;flex-wrap:wrap">' +
    liveBtn +
    '<a href="https://github.com/vrajparekh1312" target="_blank" class="btn btn-p" style="text-decoration:none;font-size:.8rem">GitHub ↗</a>' +
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

/* ── AI ASSISTANT ── */
var AI_KB = {
  projects: "Vraj's 4 major projects:<br><br>• 🏆 <b>CitySolve</b> — Hackathon-winning civic issue platform with GPS<br>• 🤖 <b>Infer@</b> — AI document intelligence for Kochi Metro Rail<br>• 🌿 <b>HerbCure</b> — AI herbal medicine detection<br>• ⛏️ <b>EnviroMine</b> — Coal mine emission analyzer",
  skills: "Tech stack:<br><br>• 💻 Python · Java · JavaScript · C<br>• 🌐 HTML/CSS · React · Next.js · Node.js · Express.js<br>• 🗄️ MongoDB · MySQL · Firebase<br>• ☁️ Google Cloud (GCP)<br>• 🤖 MERN · REST APIs · AI/ML",
  achievements: "• 🏆 <b>1st Place</b> CVMU 4.0 Hackathon<br>• ☁️ <b>4 Google Cloud Certifications</b><br>• 📊 <b>CPI: 8.79</b>",
  contact: "• 📧 vraj13122005@gmail.com<br>• 📞 +91 9316464837<br>• 🐙 github.com/vrajparekh1312<br>• 💼 linkedin.com/in/vraj-parekh-7b801b30b",
  education: "• 🎓 <b>B.Tech CE</b> — MBIT, CVM University<br>• 📊 CPI: 8.79 · strong Science foundation in HSC/SSC",
  def: "I can tell you about Vraj's <b>projects</b>, <b>skills</b>, <b>achievements</b>, <b>education</b>, or <b>contact</b> info. What would you like to know? 😊"
};

function matchAI(q) {
  var l = q.toLowerCase();
  if (/citysol/.test(l)) return "🏆 <b>CitySolve</b> won 1st place at CVMU 4.0 Hackathon! Citizens report civic issues with GPS+photos. Stack: Node.js · MongoDB · Kotlin.";
  if (/infer/.test(l)) return "🤖 <b>Infer@</b> — AI document intelligence for KMRL (SIH 2025). OCR + layout detection. Stack: Python · OpenCV · Tesseract.";
  if (/herb/.test(l)) return "🌿 <b>HerbCure</b> — Scan herbs via OCR, get AI-powered medicine alternatives. Stack: Python · Tesseract · AI/ML.";
  if (/enviro|mine/.test(l)) return "⛏️ <b>EnviroMine</b> — Calculate coal mine emissions, get AI reduction strategies. Stack: Node.js · JavaScript.";
  if (/project|build/.test(l)) return AI_KB.projects;
  if (/skill|tech|python|java|node/.test(l)) return AI_KB.skills;
  if (/achiev|award|hackathon|cert/.test(l)) return AI_KB.achievements;
  if (/contact|email|phone|linkedin|github|hire/.test(l)) return AI_KB.contact;
  if (/edu|college|cpi/.test(l)) return AI_KB.education;
  if (/hi|hello|hey/.test(l)) return "Hey! 👋 Ask me about Vraj's <b>projects</b>, <b>skills</b>, <b>education</b>, or how to <b>hire him</b>!";
  if (/who|vraj|about/.test(l)) return "Vraj Ashokbhai Parekh — CE student at MBIT (CPI: 8.79), AI developer, full-stack engineer, CVMU 4.0 Hackathon winner! 🚀";
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
  t.className = 'ai-bot';
  t.innerHTML = '<span class="tdot"></span><span class="tdot"></span><span class="tdot"></span>';
  box.appendChild(t); box.scrollTop = box.scrollHeight;
  setTimeout(function () {
    t.remove();
    var bm = document.createElement('div'); bm.className = 'ai-bot'; bm.innerHTML = matchAI(q);
    box.appendChild(bm); box.scrollTop = box.scrollHeight;
  }, 650 + Math.random() * 400);
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
    resultEl.innerHTML = '<span class="dev-success">✓ CORRECT! Access granted. Loading reward...</span>';
    submitBtn.disabled = true;
    document.querySelectorAll('.dev-choice').forEach(function (b) { b.style.pointerEvents = 'none'; });
    setTimeout(function () { closeDev(); showReward(); }, 1200);
  } else {
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
      '<div>CPI&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; : <span class="tc-amber">8.79</span></div>' +
      '<div>Location : Gujarat, India</div>' +
      '<div>Status&nbsp;&nbsp;&nbsp; : <span class="tc-green">Available for opportunities ✓</span></div>';
  },
  skills: function () {
    return '<div class="tc-violet">── LANGUAGES ──</div>' +
      '<div>Python ████████░░ 90% | Java ████████░░ 85%</div>' +
      '<div>JavaScript ████████░░ 80% | C ███████░░░ 75%</div>' +
      '<div class="tc-violet">── WEB &amp; BACKEND ──</div>' +
      '<div>Node.js/Express ████████░░ 85% | HTML/CSS █████████░ 90%</div>' +
      '<div class="tc-violet">── CLOUD &amp; AI ──</div>' +
      '<div>GCP ████████░░ 80% | OpenCV ███████░░░ 75%</div>' +
      '<div>Tesseract OCR ███████░░░ 78% | AI/ML ███████░░░ 72%</div>' +
      '<div class="tc-violet">── DATABASES ──</div>' +
      '<div>MongoDB ████████░░ 85% | MySQL ████████░░ 80%</div>';
  },
  projects: function () {
    return '<div class="tc-amber">🏆 CitySolve</div><div>&nbsp;&nbsp;&nbsp;Smart Civic Issue Reporting Platform — CVMU 4.0 Hackathon Winner</div>' +
      '<div class="tc-blue">🤖 Infer@</div><div>&nbsp;&nbsp;&nbsp;AI Document Intelligence for Kochi Metro Rail (SIH 2025)</div>' +
      '<div class="tc-green">🌿 HerbCure</div><div>&nbsp;&nbsp;&nbsp;AI Herbal Medicine Detection &amp; Recommendations</div>' +
      '<div class="tc-violet">⛏️ EnviroMine</div><div>&nbsp;&nbsp;&nbsp;Coal Mine Emission Analyzer &amp; Sustainability Platform</div>';
  },
  achievements: function () {
    return '<div class="tc-amber">🏆 1st Place — CVMU 4.0 Hackathon (2024)</div>' +
      '<div>☁️&nbsp;&nbsp;Google Cloud Infrastructure Expertise</div>' +
      '<div>🖥️&nbsp;&nbsp;Cloud Computing Fundamentals</div>' +
      '<div>🤖&nbsp;&nbsp;Level 3 GenAI: Prompt Engineering</div>' +
      '<div>🛠️&nbsp;&nbsp;Compute Engine &amp; Networking Skill Badges</div>' +
      '<div>📊&nbsp;&nbsp;Academic CPI: <span class="tc-green">8.79/10</span></div>';
  },
  contact: function () {
    return '<div>📧 Email&nbsp;&nbsp;&nbsp;&nbsp;: <span style="color:var(--neon)">vraj13122005@gmail.com</span></div>' +
      '<div>📞 Phone&nbsp;&nbsp;&nbsp;&nbsp;: <span class="tc-green">+91 9316464837</span></div>' +
      '<div>🐙 GitHub&nbsp;&nbsp;&nbsp;: <span class="tc-violet">github.com/vrajparekh1312</span></div>' +
      '<div>💼 LinkedIn : <span class="tc-blue">linkedin.com/in/vraj-parekh-7b801b30b</span></div>';
  },
  resume: function () {
    setTimeout(function () { alert('Resume coming soon!\nVisit: linkedin.com/in/vraj-parekh-7b801b30b'); }, 100);
    return '<span class="tc-amber">Opening resume... (Available on LinkedIn)</span>';
  },
  clear: function () { document.getElementById('term-output').innerHTML = ''; return null; },
  exit: function () { setTimeout(closeTerm, 300); return '<span class="tc-muted">Closing terminal...</span>'; }
};

function openTerminal() {
  document.getElementById('terminal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(function () { var ti = document.getElementById('term-inp'); if (ti) ti.focus(); }, 100);
}

function closeTerm() {
  document.getElementById('terminal-overlay').classList.remove('open');
  document.body.style.overflow = '';
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
  if (e.key === 'Enter') {
    var cmd = inp.value.trim().toLowerCase();
    if (!cmd) return;
    termHistory.unshift(cmd); termHistIdx = -1;
    appendTermLine('<span class="tc-green">vraj@portfolio</span><span class="tc-muted">:~$</span> ' + cmd);
    var fn = TERM_CMDS[cmd];
    if (fn) { var out = fn(); if (out !== null && out !== undefined) appendTermHTML(out); }
    else { appendTermLine('<span style="color:#ff5f57">bash: ' + cmd + ": command not found. Type 'help' for commands.</span>"); }
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