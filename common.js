/* AGHFAHRI — fungsi bersama (halaman publik dan admin) */
(function () {
  'use strict';

  const CFG = window.APP_CONFIG || {};
  const App = (window.App = {});

  // ── Pembantu DOM ──
  App.el = function (tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };

  // Ikon SVG kecil. Semua isinya konstanta di bawah, bukan input pengguna.
  const PATHS = {
    link: '<path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    chevron: '<path d="M9 6l6 6-6 6"/>',
    arrow: '<path d="M7 17L17 7M8 7h9v9"/>',
    back: '<path d="M15 6l-6 6 6 6"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    grip: '<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
    form: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4h6v3H9zM9 12h6M9 16h6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    up: '<path d="M6 15l6-6 6 6"/>',
    down: '<path d="M6 9l6 6 6-6"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
    check: '<path d="M5 12l5 5L20 7"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
    download: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
    sheet: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16"/>'
  };

  App.svg = function (name, cls) {
    const t = document.createElement('template');
    t.innerHTML =
      '<svg class="i ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      (PATHS[name] || '') + '</svg>';
    return t.content.firstElementChild;
  };

  // ── Alamat ──
  App.safeUrl = function (u) {
    try {
      const x = new URL(String(u || ''));
      return ['http:', 'https:', 'mailto:', 'tel:'].indexOf(x.protocol) >= 0 ? x.href : '';
    } catch (e) {
      return '';
    }
  };

  function safeHttps(u) {
    try {
      const x = new URL(String(u || ''));
      return x.protocol === 'https:' ? x.href : '';
    } catch (e) {
      return '';
    }
  }

  // ── Ikon item: bawaan, emoji, gambar, atau pustaka ikon ──
  App.icon = function (item) {
    const box = App.el('span', 'icon');
    box.setAttribute('aria-hidden', 'true');
    const jenis = item.ikon_jenis;
    const isi = String(item.ikon_isi || '');

    if (jenis === 'emoji' && isi) {
      box.classList.add('icon-emoji');
      box.textContent = isi;
    } else if (jenis === 'gambar' && isi) {
      const src = safeHttps(isi);
      if (src) {
        const img = new Image();
        img.alt = '';
        img.loading = 'lazy';
        img.referrerPolicy = 'no-referrer';
        img.src = src;
        box.append(img);
      }
    } else if (jenis === 'pustaka' && /^[a-z0-9]{1,50}$/.test(isi)) {
      const g = App.el('span', 'glyph');
      g.style.setProperty('--icon-url', 'url("' + (CFG.ICON_CDN || '') + isi + '.svg")');
      box.append(g);
    } else {
      box.append(App.svg(item.tipe === 'folder' ? 'folder' : item.tipe === 'form' ? 'form' : item.tipe === 'dashboard' ? 'chart' : 'link'));
    }
    return box;
  };

  // ── Teks bacaan: **tebal**, *miring*, daftar bernomor (1. ...), daftar butir (- ...) ──
  // Dibangun dengan DOM (bukan innerHTML), jadi isi dari admin tidak bisa menyisipkan HTML.
  function inline(parent, text) {
    String(text).split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/).forEach(function (part) {
      if (!part) return;
      if (/^\*\*[^*]+\*\*$/.test(part)) parent.append(App.el('strong', '', part.slice(2, -2)));
      else if (/^\*[^*\s][^*]*\*$/.test(part)) parent.append(App.el('em', '', part.slice(1, -1)));
      else parent.append(document.createTextNode(part));
    });
  }

  App.rich = function (text) {
    const frag = document.createDocumentFragment();
    let para = [];
    let list = null;

    function flushPara() {
      if (!para.length) return;
      const p = document.createElement('p');
      para.forEach(function (ln, i) {
        if (i) p.append(document.createElement('br'));
        inline(p, ln);
      });
      frag.append(p);
      para = [];
    }

    String(text == null ? '' : text).replace(/\r\n?/g, '\n').split('\n').forEach(function (raw) {
      const line = raw.trim();
      if (!line) { flushPara(); list = null; return; }
      let m = /^(\d+)[.)]\s+(.*)$/.exec(line);
      let tag = 'ol';
      if (!m) { m = /^[-*\u2022]\s+(.*)$/.exec(line); tag = 'ul'; }
      if (m) {
        flushPara();
        if (!list || list.tagName.toLowerCase() !== tag) {
          list = document.createElement(tag);
          if (tag === 'ol') list.start = Number(m[1]) || 1;
          frag.append(list);
        }
        const li = document.createElement('li');
        inline(li, tag === 'ol' ? m[2] : m[1]);
        list.append(li);
        return;
      }
      list = null;
      para.push(line);
    });
    flushPara();
    return frag;
  };

  App.randomId = function (n) {
    const bytes = new Uint8Array(n);
    (window.crypto || window.msCrypto).getRandomValues(bytes);
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    return Array.prototype.map.call(bytes, function (b) { return chars[b % chars.length]; }).join('');
  };

  // Pengenal perangkat untuk batas kirim per perangkat. Tersimpan di browser.
  App.deviceId = function () {
    let id = lsGet('dev_id');
    if (!/^[A-Za-z0-9_-]{8,64}$/.test(id || '')) {
      id = App.randomId(20);
      lsSet('dev_id', id);
    }
    return id;
  };

  App.fmtDateTime = function (iso) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });
  };

  // ── Layar pembuka berlogo ──
  App.splash = {
    t0: performance.now(),
    hide: function (minMs) {
      const s = document.getElementById('splash');
      if (!s || s.dataset.leaving) return;
      s.dataset.leaving = '1';
      const wait = Math.max(0, (minMs || 0) - (performance.now() - App.splash.t0));
      setTimeout(function () {
        s.classList.add('out');
        setTimeout(function () { s.remove(); }, 700);
      }, wait);
    }
  };
  // Jaga-jaga: layar pembuka tidak boleh menutup halaman selamanya.
  setTimeout(function () { App.splash.hide(0); }, 15000);

  // ── Server ──
  App.configured = function () {
    return /^https:\/\/script\.google\.com\//.test(CFG.API_URL || '');
  };

  function apiError(message, code) {
    const e = new Error(message);
    e.code = code;
    return e;
  }

  async function readResponse(fetching) {
    let res;
    try {
      res = await fetching;
    } catch (e) {
      throw apiError('Tidak bisa terhubung ke server. Periksa koneksi internet.', 'NETWORK');
    }
    let json;
    try {
      json = await res.json();
    } catch (e) {
      throw apiError('Respons server tidak valid. Pastikan URL Web App benar dan aksesnya "Anyone".', 'BAD_RESPONSE');
    }
    if (!json.ok) throw apiError(json.error || 'Terjadi kesalahan.', json.code || 'ERROR');
    return json.data;
  }

  function needConfig() {
    if (!App.configured()) {
      throw apiError('config.js belum diisi dengan URL Web App.', 'CONFIG');
    }
  }

  // Parameter waktu dan cache: 'no-store' mencegah browser memakai balasan lama,
  // jadi perubahan dari admin langsung terlihat tanpa muat ulang paksa.
  App.get = async function (params) {
    needConfig();
    const query = new URLSearchParams(Object.assign({}, params, { t: Date.now() }));
    return readResponse(fetch(CFG.API_URL + '?' + query, { cache: 'no-store' }));
  };

  // POST memakai text/plain agar browser tidak mengirim preflight CORS yang tidak didukung Apps Script.
  App.post = async function (payload) {
    needConfig();
    return readResponse(fetch(CFG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    }));
  };

  // Hitung klik tanpa menunda pengunjung membuka link.
  App.ping = function (id) {
    if (!App.configured()) return;
    const body = JSON.stringify({ action: 'click', id: id });
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(CFG.API_URL, body)) return;
    } catch (e) { /* lanjut ke fetch */ }
    try {
      fetch(CFG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: body,
        keepalive: true
      }).catch(function () {});
    } catch (e) { /* abaikan */ }
  };

  // ── Tema ──
  function lsGet(k) {
    try { return localStorage.getItem(k); } catch (e) { return null; }
  }
  function lsSet(k, v) {
    try { localStorage.setItem(k, v); } catch (e) { /* abaikan */ }
  }

  App.theme = {
    resolve: function (pref) {
      if (pref === 'light' || pref === 'dark') return pref;
      return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    },
    apply: function (pref) {
      document.documentElement.setAttribute('data-theme', App.theme.resolve(pref));
    },
    // Tema bawaan dari pengaturan admin. Dipakai bila pengunjung belum memilih sendiri.
    setDefault: function (pref) {
      lsSet('tema_def', pref);
      if (!lsGet('tema')) App.theme.apply(pref);
    },
    toggle: function () {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      lsSet('tema', next);
      App.theme.apply(next);
    }
  };

  if (window.matchMedia) {
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
      if (!lsGet('tema')) App.theme.apply(lsGet('tema_def') || 'auto');
    });
  }
})();
