// Sweet Cash – Main JS

// ===== HEADER SCROLL =====
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header && (header.classList.toggle('scrolled', window.scrollY > 40));
});

// ===== HAMBURGER =====
const hamburger = document.getElementById('hamburger');
const nav = document.getElementById('nav');
hamburger && hamburger.addEventListener('click', () => {
  nav.classList.toggle('open');
});

// ===== FADE UP ANIMATION =====
const fadeEls = document.querySelectorAll('.card, .segment-card, .case-card, .segment-full-card, .service-block, .stat-card, .tool-card');
fadeEls.forEach(el => el.classList.add('fade-up'));
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
fadeEls.forEach(el => observer.observe(el));

// ===== NOTIFICATION =====
function showNotification(msg) {
  let n = document.createElement('div');
  n.className = 'notification';
  n.innerHTML = `<span>✅</span> ${msg}`;
  document.body.appendChild(n);
  setTimeout(() => n.classList.add('show'), 10);
  setTimeout(() => { n.classList.remove('show'); setTimeout(() => n.remove(), 400); }, 4000);
}

// ===== SWEETCASH SUBMIT API =====
const SWEETCASH_SUBMIT_URL = 'https://admin.sweetcashsolutions.com/api/sweetcash/submit';

function buildSubmitFormData(form) {
  const fd = new FormData(form);
  const out = new FormData();
  const keys = ['first_name', 'last_name', 'email', 'phone', 'category', 'loan_need', 'message'];
  keys.forEach(k => {
    const v = (fd.get(k) || '').toString().trim();
    if (v) out.append(k, v);
  });
  return out;
}

function showErrorNotification(msg) {
  let n = document.createElement('div');
  n.className = 'notification notification-error';
  n.innerHTML = `<span>⚠️</span> ${msg}`;
  document.body.appendChild(n);
  setTimeout(() => n.classList.add('show'), 10);
  setTimeout(() => { n.classList.remove('show'); setTimeout(() => n.remove(), 400); }, 5000);
}

async function submitSweetCashForm(form) {
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn ? submitBtn.textContent : '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
  }
  const formData = buildSubmitFormData(form);
  try {
    const res = await fetch(SWEETCASH_SUBMIT_URL, {
      method: 'POST',
      body: formData
    });
    const data = await res.json().catch(() => ({}));
    const apiMessage = (data.message || data.msg || '').trim();
    if (res.ok) {
      showNotification(apiMessage || 'Thank you for your submission!');
      form.reset();
    } else {
      let msg = apiMessage || data.error || '';
      if (!msg && res.status === 422 && data.errors && typeof data.errors === 'object') {
        const parts = Object.entries(data.errors).map(([k, v]) => Array.isArray(v) ? v.join(', ') : v);
        msg = parts.length ? parts.join(' ') : msg;
      }
      if (!msg) msg = `Request failed (${res.status}). Please try again.`;
      showErrorNotification(msg);
      if (res.status === 422) console.warn('SweetCash API 422 详情:', data);
    }
  } catch (err) {
    showErrorNotification('Network error. Please check your connection and try again.');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }
}

// ===== FORMS =====
document.querySelectorAll('form').forEach(form => {
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (form.id === 'consultForm' || form.id === 'contactForm') {
      await submitSweetCashForm(form);
      return;
    }
    showNotification('Thank you! We\'ll contact you within 24 hours.');
    form.reset();
  });
});

// ===== LOAN CALCULATOR =====
function calcLoan() {
  const amount = parseFloat(document.getElementById('loanAmount')?.value) || 0;
  const months = parseInt(document.getElementById('loanMonths')?.value) || 12;
  const rate = parseFloat(document.getElementById('loanRate')?.value) || 10;
  if (amount > 0) {
    const r = rate / 100 / 12;
    const payment = r > 0 ? (amount * r * Math.pow(1+r,months)) / (Math.pow(1+r,months)-1) : amount/months;
    const el = document.getElementById('monthlyPayment');
    if (el) el.textContent = '$' + payment.toFixed(2);
    const totalEl = document.getElementById('totalPayment');
    if (totalEl) totalEl.textContent = '$' + (payment * months).toFixed(2);
  }
}

// ===== DTI CALCULATOR =====
function calcDTI() {
  const monthly = parseFloat(document.getElementById('monthlyDebt')?.value) || 0;
  const income = parseFloat(document.getElementById('monthlyIncome')?.value) || 1;
  const dti = (monthly / income * 100).toFixed(1);
  const el = document.getElementById('dtiResult');
  if (el) {
    el.textContent = dti + '%';
    const label = document.getElementById('dtiLabel');
    if (label) {
      if (dti <= 20) label.textContent = '✅ Excellent – strong eligibility';
      else if (dti <= 36) label.textContent = '👍 Good – likely eligible';
      else if (dti <= 43) label.textContent = '⚠️ Fair – some lenders may qualify you';
      else label.textContent = '❌ High – consider reducing debt first';
    }
  }
}

// Attach calculator events
document.getElementById('loanAmount')?.addEventListener('input', calcLoan);
document.getElementById('loanMonths')?.addEventListener('input', calcLoan);
document.getElementById('loanRate')?.addEventListener('input', calcLoan);
document.getElementById('monthlyDebt')?.addEventListener('input', calcDTI);
document.getElementById('monthlyIncome')?.addEventListener('input', calcDTI);

// ===== WIZARD (multi-step) =====
let wizardStep = 1;
function nextStep(n) {
  document.querySelectorAll('.wizard-panel').forEach((p, i) => {
    p.style.display = (i + 1 === n) ? 'block' : 'none';
  });
  document.querySelectorAll('.wizard-step').forEach((s, i) => {
    s.classList.toggle('active', i + 1 === n);
  });
  wizardStep = n;
}
