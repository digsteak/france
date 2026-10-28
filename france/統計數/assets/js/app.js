const STATS = [
  {
    id: 'atk', name: '攻擊力', short: 'ATK', en: 'ATTACK POWER', icon: '⚔️',
    base: 2100, gain: 45, max: 20,
    tags: ['物理傷害', '破甲'],
    accent: '#ef4444', soft: 'rgba(239, 68, 68, 0.16)', line: 'rgba(239, 68, 68, 0.34)',
    value: '#fca5a5', glow: 'rgba(239, 68, 68, 0.35)'
  },
  {
    id: 'hp', name: '體力', short: 'HP', en: 'HIT POINTS', icon: '❤️',
    base: 8500, gain: 250, max: 20,
    tags: ['最大血量', '物理抵禦'],
    accent: '#f43f5e', soft: 'rgba(244, 63, 94, 0.14)', line: 'rgba(244, 63, 94, 0.32)',
    value: '#fda4af', glow: 'rgba(244, 63, 94, 0.32)'
  },
  {
    id: 'matk', name: '魔法', short: 'MATK', en: 'MAGIC ATTACK', icon: '✨',
    base: 850, gain: 40, max: 20,
    tags: ['魔法傷害', '元素爆發'],
    accent: '#6366f1', soft: 'rgba(99, 102, 241, 0.16)', line: 'rgba(99, 102, 241, 0.34)',
    value: '#c7d2fe', glow: 'rgba(99, 102, 241, 0.35)'
  },
  {
    id: 'int', name: '智力', short: 'INT', en: 'INTELLIGENCE', icon: '🔮',
    base: 180, gain: 6, max: 20,
    tags: ['魔力恢復', '魔力上限', '法術學習'],
    accent: '#a855f7', soft: 'rgba(168, 85, 247, 0.15)', line: 'rgba(168, 85, 247, 0.34)',
    value: '#ddd6fe', glow: 'rgba(168, 85, 247, 0.35)'
  },
  {
    id: 'agi', name: '敏捷度', short: 'AGI', en: 'AGILITY', icon: '💨',
    base: 240, gain: 8, max: 20,
    tags: ['移動速度', '攻擊速度'],
    accent: '#10b981', soft: 'rgba(16, 185, 129, 0.14)', line: 'rgba(16, 185, 129, 0.32)',
    value: '#6ee7b7', glow: 'rgba(16, 185, 129, 0.32)'
  },
  {
    id: 'lck', name: '運氣', short: 'LCK', en: 'LUCK', icon: '🍀',
    base: 55, gain: 4, max: 20,
    tags: ['暴擊率', '掉寶率', '賭博勝率'],
    accent: '#f59e0b', soft: 'rgba(245, 158, 11, 0.15)', line: 'rgba(245, 158, 11, 0.34)',
    value: '#fde68a', glow: 'rgba(245, 158, 11, 0.35)'
  }
];

const SP_TOTAL = 20;
const STORAGE_KEY = 'attribute-allocation-v1';

const points = {};
STATS.forEach(s => { points[s.id] = 0; });

let remaining = SP_TOTAL;
let toastTimer = null;

const byId = id => STATS.find(s => s.id === id);
const fmt = n => Math.round(n).toLocaleString('en-US');
const statValue = s => s.base + s.gain * points[s.id];
const accentStyle = s =>
  `--accent:${s.accent};--soft:${s.soft};--line-c:${s.line};--val:${s.value};--glow:${s.glow}`;

function heroTemplate(s) {
  return `
    <article class="card hero" style="${accentStyle(s)}">
      <div class="hero-head">
        <div class="icon" aria-hidden="true">${s.icon}</div>
        <div class="titles">
          <span class="en">${s.en}</span>
          <h2>${s.name} <span class="zh-en">(${s.short})</span></h2>
          <div class="tags">${s.tags.map(t => `<span>${t}</span>`).join('')}</div>
        </div>
      </div>

      <div class="hero-value">
        <div class="value-row">
          <span class="value" id="val-${s.id}">0</span>
          <span class="unit">${s.short}</span>
          <span class="gain">每點 +${s.gain}</span>
        </div>
        <div class="sub">
          傷害區間 <span id="atk-range">0 ~ 0</span> ・ 基礎 ${fmt(s.base)} + 配點 <span id="atk-bonus">+0</span>
        </div>
      </div>

      <div class="hero-side">
        <span class="pts">已投入 <b id="pts-${s.id}">0</b> / ${s.max} 點</span>
        <div class="meter"><div class="meter-fill" id="meter-${s.id}"></div></div>
        <div class="controls">
          <button type="button" class="minus" data-id="${s.id}" data-delta="-1" aria-label="退回 1 點${s.name}">−</button>
          <button type="button" class="plus" data-id="${s.id}" data-delta="1">+1 升級</button>
        </div>
      </div>
    </article>`;
}

function cardTemplate(s) {
  return `
    <article class="card" style="${accentStyle(s)}">
      <div class="card-top">
        <div class="icon" aria-hidden="true">${s.icon}</div>
        <div class="titles">
          <span class="en">${s.en}</span>
          <h2>${s.name} <span class="zh-en">(${s.short})</span></h2>
        </div>
        <span class="pts"><b id="pts-${s.id}">0</b>/${s.max}</span>
      </div>

      <div class="value-row">
        <span class="value" id="val-${s.id}">0</span>
        <span class="gain">每點 +${s.gain}</span>
      </div>

      <div class="tags">${s.tags.map(t => `<span>${t}</span>`).join('')}</div>

      <div class="meter"><div class="meter-fill" id="meter-${s.id}"></div></div>

      <div class="controls">
        <button type="button" class="minus" data-id="${s.id}" data-delta="-1" aria-label="退回 1 點${s.name}">−</button>
        <button type="button" class="plus" data-id="${s.id}" data-delta="1">+1 升級</button>
      </div>
    </article>`;
}

function render() {
  document.getElementById('remaining-sp').textContent = remaining;

  STATS.forEach(s => {
    const p = points[s.id];
    const valueEl = document.getElementById(`val-${s.id}`);
    const ptsEl = document.getElementById(`pts-${s.id}`);
    const meterEl = document.getElementById(`meter-${s.id}`);
    const minusBtn = document.querySelector(`button.minus[data-id="${s.id}"]`);
    const plusBtn = document.querySelector(`button.plus[data-id="${s.id}"]`);

    if (valueEl) valueEl.textContent = fmt(statValue(s));
    if (ptsEl) ptsEl.textContent = p;
    if (meterEl) meterEl.style.width = `${(p / s.max) * 100}%`;
    if (minusBtn) minusBtn.disabled = p <= 0;
    if (plusBtn) plusBtn.disabled = p >= s.max || remaining <= 0;

    if (s.id === 'atk') {
      const total = statValue(s);
      const rangeEl = document.getElementById('atk-range');
      const bonusEl = document.getElementById('atk-bonus');
      if (rangeEl) rangeEl.textContent = `${fmt(total * 0.95)} ~ ${fmt(total * 1.05)}`;
      if (bonusEl) bonusEl.textContent = `+${fmt(s.gain * p)}`;
    }
  });
}

function animateGain(stat, amount) {
  const valueEl = document.getElementById(`val-${stat.id}`);
  if (!valueEl) return;

  valueEl.classList.remove('bump');
  void valueEl.offsetWidth;
  valueEl.classList.add('bump');

  const row = valueEl.closest('.value-row');
  if (!row) return;

  const floatEl = document.createElement('span');
  floatEl.className = 'float-gain';
  floatEl.textContent = `+${fmt(amount)}`;
  row.appendChild(floatEl);
  setTimeout(() => floatEl.remove(), 900);
}

function changeStat(id, delta) {
  const stat = byId(id);
  if (!stat) return;

  if (delta > 0) {
    if (points[id] >= stat.max) {
      showToast(`${stat.name}已達上限 ${stat.max} 點`);
      return;
    }
    if (remaining <= 0) {
      showToast('點數不足，無法升級');
      return;
    }
    points[id] += 1;
    remaining -= 1;
    animateGain(stat, stat.gain);
  } else {
    if (points[id] <= 0) return;
    points[id] -= 1;
    remaining += 1;
  }

  render();
}

function saveConfig() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ points, remaining }));
    showToast('配置已儲存');
  } catch (err) {
    showToast('此瀏覽器無法使用本機儲存');
  }
}

function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || !data.points) return;

    const next = {};
    let used = 0;
    let valid = true;

    STATS.forEach(s => {
      const v = Number(data.points[s.id]);
      if (!Number.isInteger(v) || v < 0 || v > s.max) {
        valid = false;
        return;
      }
      next[s.id] = v;
      used += v;
    });

    if (!valid || used > SP_TOTAL) return;

    STATS.forEach(s => { points[s.id] = next[s.id]; });
    remaining = SP_TOTAL - used;
  } catch (err) {
    // ignore
  }
}

function resetState(notify) {
  STATS.forEach(s => { points[s.id] = 0; });
  remaining = SP_TOTAL;

  if (notify) {
    try { localStorage.removeItem(STORAGE_KEY); } catch (err) {}
    showToast('已重置全部配點');
  }

  render();
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-msg');
  if (!toast || !toastMsg) return;
  toastMsg.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
}

function init() {
  const grid = document.getElementById('stat-grid');
  if (!grid) return;

  const filterAttr = grid.getAttribute('data-filter');
  const filterList = filterAttr ? filterAttr.split(',').map(x => x.trim()).filter(Boolean) : null;

  const list = filterList ? STATS.filter(s => filterList.includes(s.id)) : STATS;
  const useHero = list.length === STATS.length && list[0]?.id === 'atk';

  if (useHero) {
    grid.classList.add('grid--full');
    grid.innerHTML =
      heroTemplate(byId('atk')) +
      STATS.filter(s => s.id !== 'atk').map(cardTemplate).join('');
  } else {
    grid.innerHTML = list.map(cardTemplate).join('');
    if (list.length === 1) {
      const card = grid.querySelector('.card');
      if (card) card.style.gridColumn = '1 / -1';
    }
  }

  const spTotalEl = document.getElementById('sp-total');
  if (spTotalEl) spTotalEl.textContent = SP_TOTAL;

  const btnReset = document.getElementById('btn-reset');
  const btnSave = document.getElementById('btn-save');
  if (btnReset) btnReset.addEventListener('click', () => resetState(true));
  if (btnSave) btnSave.addEventListener('click', saveConfig);

  grid.addEventListener('click', (event) => {
    const btn = event.target.closest('button[data-id]');
    if (!btn) return;
    changeStat(btn.dataset.id, Number(btn.dataset.delta));
  });

  loadConfig();
  render();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
