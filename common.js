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
    trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>'
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
      box.append(App.svg(item.tipe === 'folder' ? 'folder' : 'link'));
    }
    return box;
  };

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

  App.get = async function (params) {
    needConfig();
    return readResponse(fetch(CFG.API_URL + '?' + new URLSearchParams(params)));
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
