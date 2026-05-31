/* =====================
   TOOL SWITCHER
   ===================== */
const cards = document.querySelectorAll('.tool-card');
const panels = document.querySelectorAll('.calc-panel');

cards.forEach(card => {
  card.addEventListener('click', () => {
    const tool = card.dataset.tool;
    cards.forEach(c => c.classList.remove('active'));
    panels.forEach(p => p.classList.remove('active'));
    card.classList.add('active');
    document.getElementById('calc-' + tool).classList.add('active');
    document.getElementById('calculator').scrollIntoView({ behavior: 'smooth', block: 'start' });
    runCalc(tool);
  });
});

/* =====================
   RANGE ↔ NUMBER SYNC
   ===================== */
function syncRangeNumber(numId, rangeId, onchange) {
  const num = document.getElementById(numId);
  const range = document.getElementById(rangeId);
  if (!num || !range) return;
  num.addEventListener('input', () => { range.value = num.value; onchange(); });
  range.addEventListener('input', () => { num.value = range.value; onchange(); });
}

/* =====================
   FORMAT CURRENCY
   ===================== */
function fmt(n) {
  if (isNaN(n) || n === null) return '₹0';
  if (n >= 10000000) return '₹' + (n / 10000000).toFixed(2) + ' Cr';
  if (n >= 100000)   return '₹' + (n / 100000).toFixed(2) + ' L';
  return '₹' + Math.round(n).toLocaleString('en-IN');
}

/* =====================
   MINI PIE CHART
   ===================== */
function drawPie(canvasId, values, colors, legendId, labels) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = 100, cy = 100, r = 80;
  const total = values.reduce((a, b) => a + b, 0);
  ctx.clearRect(0, 0, 200, 200);
  let startAngle = -Math.PI / 2;
  values.forEach((val, i) => {
    const slice = (val / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, startAngle + slice);
    ctx.closePath();
    ctx.fillStyle = colors[i];
    ctx.fill();
    startAngle += slice;
  });
  // Center hole
  ctx.beginPath();
  ctx.arc(cx, cy, 44, 0, 2 * Math.PI);
  ctx.fillStyle = '#111827';
  ctx.fill();
  // Legend
  const legend = document.getElementById(legendId);
  if (legend) {
    legend.innerHTML = labels.map((l, i) =>
      `<div class="legend-item"><div class="legend-dot" style="background:${colors[i]}"></div>${l}: <strong style="color:var(--text);margin-left:4px">${fmt(values[i])}</strong></div>`
    ).join('');
  }
}

/* =====================
   1. EMI CALCULATOR
   ===================== */
function calcEMI() {
  const P = parseFloat(document.getElementById('emi-amount').value) || 0;
  const r = (parseFloat(document.getElementById('emi-rate').value) || 0) / 12 / 100;
  const n = parseInt(document.getElementById('emi-tenure').value) || 1;
  let emi = 0, totalInt = 0, total = 0;
  if (r === 0) { emi = P / n; } else {
    emi = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
  }
  total = emi * n;
  totalInt = total - P;
  document.getElementById('emi-result').textContent = fmt(emi);
  document.getElementById('emi-interest').textContent = fmt(totalInt);
  document.getElementById('emi-total').textContent = fmt(total);
  drawPie('emi-chart', [P, totalInt], ['#00d4aa', '#3b82f6'], 'emi-legend', ['Principal', 'Interest']);
}

syncRangeNumber('emi-amount', 'emi-amount-range', calcEMI);
syncRangeNumber('emi-rate', 'emi-rate-range', calcEMI);
syncRangeNumber('emi-tenure', 'emi-tenure-range', calcEMI);

/* =====================
   2. GST CALCULATOR
   ===================== */
let gstMode = 'add';
function setGSTMode(mode) {
  gstMode = mode;
  document.getElementById('gst-add-btn').classList.toggle('active', mode === 'add');
  document.getElementById('gst-remove-btn').classList.toggle('active', mode === 'remove');
  calcGST();
}
function calcGST() {
  const amount = parseFloat(document.getElementById('gst-amount').value) || 0;
  const rate = parseFloat(document.getElementById('gst-rate').value) || 0;
  let original, gstAmt, total;
  if (gstMode === 'add') {
    original = amount;
    gstAmt = amount * rate / 100;
    total = amount + gstAmt;
  } else {
    total = amount;
    original = amount * 100 / (100 + rate);
    gstAmt = total - original;
  }
  document.getElementById('gst-original').textContent = fmt(original);
  document.getElementById('gst-cgst').textContent = fmt(gstAmt / 2);
  document.getElementById('gst-sgst').textContent = fmt(gstAmt / 2);
  document.getElementById('gst-total').textContent = fmt(total);
}
document.getElementById('gst-amount').addEventListener('input', calcGST);
document.getElementById('gst-rate').addEventListener('change', calcGST);

/* =====================
   3. SIP CALCULATOR
   ===================== */
function calcSIP() {
  const P = parseFloat(document.getElementById('sip-amount').value) || 0;
  const r = (parseFloat(document.getElementById('sip-rate').value) || 0) / 12 / 100;
  const n = (parseInt(document.getElementById('sip-years').value) || 0) * 12;
  const invested = P * n;
  const fv = r === 0 ? invested : P * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  const returns = fv - invested;
  document.getElementById('sip-invested').textContent = fmt(invested);
  document.getElementById('sip-returns').textContent = fmt(returns);
  document.getElementById('sip-total').textContent = fmt(fv);
  drawPie('sip-chart', [invested, returns], ['#3b82f6', '#00d4aa'], 'sip-legend', ['Invested', 'Returns']);
}
syncRangeNumber('sip-amount', 'sip-amount-range', calcSIP);
syncRangeNumber('sip-rate', 'sip-rate-range', calcSIP);
syncRangeNumber('sip-years', 'sip-years-range', calcSIP);

/* =====================
   4. INCOME TAX CALCULATOR
   ===================== */
function calcTax(income, slabs) {
  let tax = 0;
  for (const [min, max, rate] of slabs) {
    if (income <= min) break;
    const taxable = Math.min(income, max) - min;
    tax += taxable * rate / 100;
  }
  return tax;
}
function calcIncomeTax() {
  const income = parseFloat(document.getElementById('tax-income').value) || 0;
  const age = document.getElementById('tax-age').value;
  const ded = parseFloat(document.getElementById('tax-deductions').value) || 0;
  const stdDed = 50000;

  // Old regime slabs
  let basic = income < 60 ? 250000 : income < 80 ? 300000 : 500000;
  const oldIncome = Math.max(0, income - stdDed - ded);
  const oldSlabs = [
    [0, basic, 0], [basic, 500000, 5], [500000, 1000000, 20], [1000000, Infinity, 30]
  ];
  let oldTax = calcTax(oldIncome, oldSlabs);
  if (oldIncome <= 500000) oldTax = Math.min(oldTax, 12500); // rebate 87A
  oldTax *= 1.04; // cess

  // New regime 2024-25
  const newIncome = Math.max(0, income - stdDed);
  const newSlabs = [
    [0, 300000, 0], [300000, 700000, 5], [700000, 1000000, 10],
    [1000000, 1200000, 15], [1200000, 1500000, 20], [1500000, Infinity, 30]
  ];
  let newTax = calcTax(newIncome, newSlabs);
  if (newIncome <= 700000) newTax = 0; // rebate 87A
  newTax *= 1.04;

  document.getElementById('old-taxable').textContent = fmt(oldIncome);
  document.getElementById('old-tax').textContent = fmt(oldTax);
  document.getElementById('new-taxable').textContent = fmt(newIncome);
  document.getElementById('new-tax').textContent = fmt(newTax);

  const saving = Math.abs(oldTax - newTax);
  if (newTax < oldTax) {
    document.getElementById('tax-better').textContent = `New Regime saves you ${fmt(saving)}`;
    document.getElementById('tax-better').style.color = 'var(--accent)';
  } else if (oldTax < newTax) {
    document.getElementById('tax-better').textContent = `Old Regime saves you ${fmt(saving)}`;
    document.getElementById('tax-better').style.color = 'var(--accent3)';
  } else {
    document.getElementById('tax-better').textContent = 'Both regimes equal';
  }
}
document.getElementById('tax-income').addEventListener('input', calcIncomeTax);
document.getElementById('tax-income-range').addEventListener('input', () => {
  document.getElementById('tax-income').value = document.getElementById('tax-income-range').value;
  calcIncomeTax();
});
document.getElementById('tax-age').addEventListener('change', calcIncomeTax);
document.getElementById('tax-deductions').addEventListener('input', calcIncomeTax);

/* =====================
   5. FD CALCULATOR
   ===================== */
function calcFD() {
  const P = parseFloat(document.getElementById('fd-principal').value) || 0;
  const r = (parseFloat(document.getElementById('fd-rate').value) || 0) / 100;
  const t = parseInt(document.getElementById('fd-years').value) || 0;
  const n = parseInt(document.getElementById('fd-compound').value) || 4;
  const A = P * Math.pow(1 + r / n, n * t);
  const interest = A - P;
  document.getElementById('fd-p').textContent = fmt(P);
  document.getElementById('fd-interest').textContent = fmt(interest);
  document.getElementById('fd-maturity').textContent = fmt(A);
}
syncRangeNumber('fd-principal', 'fd-principal-range', calcFD);
syncRangeNumber('fd-rate', 'fd-rate-range', calcFD);
syncRangeNumber('fd-years', 'fd-years-range', calcFD);
document.getElementById('fd-compound').addEventListener('change', calcFD);

/* =====================
   6. HRA CALCULATOR
   ===================== */
let hraCity = 'metro';
function setHRACity(city) {
  hraCity = city;
  document.getElementById('hra-metro-btn').classList.toggle('active', city === 'metro');
  document.getElementById('hra-nonmetro-btn').classList.toggle('active', city === 'nonmetro');
  calcHRA();
}
function calcHRA() {
  const basic = parseFloat(document.getElementById('hra-basic').value) || 0;
  const received = parseFloat(document.getElementById('hra-received').value) || 0;
  const rent = parseFloat(document.getElementById('hra-rent').value) || 0;
  const pct = hraCity === 'metro' ? 0.5 : 0.4;
  const exempt = Math.min(
    received,
    pct * basic,
    Math.max(0, rent - 0.1 * basic)
  );
  const taxable = received - exempt;
  const annualExempt = exempt * 12;
  const annualTaxable = taxable * 12;
  const saving = annualExempt * 0.3;
  document.getElementById('hra-exempt').textContent = fmt(annualExempt);
  document.getElementById('hra-taxable').textContent = fmt(annualTaxable);
  document.getElementById('hra-saving').textContent = fmt(saving);
}
['hra-basic','hra-received','hra-rent'].forEach(id =>
  document.getElementById(id).addEventListener('input', calcHRA)
);

/* =====================
   7. GRATUITY CALCULATOR
   ===================== */
let gratuityType = 'covered';
function setGratuityType(type) {
  gratuityType = type;
  document.getElementById('g-covered-btn').classList.toggle('active', type === 'covered');
  document.getElementById('g-notcovered-btn').classList.toggle('active', type === 'notcovered');
  calcGratuity();
}
function calcGratuity() {
  const salary = parseFloat(document.getElementById('g-salary').value) || 0;
  const years = parseInt(document.getElementById('g-years').value) || 0;
  let amount;
  if (gratuityType === 'covered') {
    amount = (salary * 15 * years) / 26;
  } else {
    amount = (salary * 15 * years) / 30;
  }
  const limit = 2000000;
  amount = Math.min(amount, limit);
  document.getElementById('g-amount').textContent = fmt(amount);
  document.getElementById('g-status').textContent = amount >= limit ? '⚠️ Capped at ₹20L tax-free limit' : '✅ Fully tax-free';
}
syncRangeNumber('g-salary', 'g-salary-range', calcGratuity);
syncRangeNumber('g-years', 'g-years-range', calcGratuity);

/* =====================
   8. LOAN ELIGIBILITY
   ===================== */
function calcLoanEligibility() {
  const income = parseFloat(document.getElementById('le-income').value) || 0;
  const existing = parseFloat(document.getElementById('le-existing').value) || 0;
  const r = (parseFloat(document.getElementById('le-rate').value) || 0) / 12 / 100;
  const n = (parseInt(document.getElementById('le-tenure').value) || 0) * 12;
  const foir = 0.5;
  const maxEMI = income * foir - existing;
  let maxLoan = 0;
  if (r === 0) { maxLoan = maxEMI * n; } else {
    maxLoan = maxEMI * (Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n));
  }
  document.getElementById('le-maxemi').textContent = fmt(Math.max(0, maxEMI));
  document.getElementById('le-maxloan').textContent = fmt(Math.max(0, maxLoan));
}
syncRangeNumber('le-income', 'le-income-range', calcLoanEligibility);
syncRangeNumber('le-rate', 'le-rate-range', calcLoanEligibility);
syncRangeNumber('le-tenure', 'le-tenure-range', calcLoanEligibility);
document.getElementById('le-existing').addEventListener('input', calcLoanEligibility);

/* =====================
   RUN ALL ON LOAD
   ===================== */
function runCalc(tool) {
  const map = {
    emi: calcEMI, gst: calcGST, sip: calcSIP,
    tax: calcIncomeTax, fd: calcFD, hra: calcHRA,
    gratuity: calcGratuity, loan: calcLoanEligibility
  };
  if (map[tool]) map[tool]();
}

// Init all on load
calcEMI(); calcGST(); calcSIP(); calcIncomeTax();
calcFD(); calcHRA(); calcGratuity(); calcLoanEligibility();
