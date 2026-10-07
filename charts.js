/* AGHFAHRI — grafik hasil form (dipakai dashboard publik dan panel admin) */
(function () {
  'use strict';
  const el = App.el;

  function pct(a, b) { return b ? Math.round((a / b) * 1000) / 10 : 0; }
  function fmt(n) { return String(n).replace('.', ','); }

  function bars(q) {
    const wrap = el('div', 'bars');
    const max = q.opsi.reduce(function (m, o) { return Math.max(m, o.jumlah); }, 0);
    q.opsi.forEach(function (o) {
      const p = pct(o.jumlah, q.n);
      const row = el('div', 'bar-row' + (max > 0 && o.jumlah === max ? ' top' : ''));
      const head = el('div', 'bar-head');
      head.append(el('span', 'bar-label', o.label), el('span', 'bar-val', o.jumlah + ' · ' + fmt(p) + '%'));
      const track = el('div', 'bar-track');
      const fill = el('span', 'bar-fill');
      fill.style.setProperty('--w', p + '%');
      track.append(fill);
      row.append(head, track);
      wrap.append(row);
    });
    return wrap;
  }

  function scale(q) {
    const s = q.skala;
    const wrap = el('div', 'scale-chart');
    const top = el('div', 'avg');
    top.append(el('strong', '', s.rata === null ? '–' : fmt(s.rata)), el('span', '', 'rata-rata dari ' + s.min + ' sampai ' + s.maks));
    wrap.append(top);
    const max = s.dist.reduce(function (m, d) { return Math.max(m, d.jumlah); }, 0);
    const cols = el('div', 'cols');
    s.dist.forEach(function (d) {
      const c = el('div', 'col' + (max > 0 && d.jumlah === max ? ' top' : ''));
      const bar = el('span', 'col-bar');
      bar.style.setProperty('--h', (max ? (d.jumlah / max) * 100 : 0) + '%');
      c.append(el('span', 'col-n', String(d.jumlah)), el('span', 'col-track'), el('span', 'col-lab', String(d.nilai)));
      c.querySelector('.col-track').append(bar);
      cols.append(c);
    });
    wrap.append(cols);
    if (s.label_min || s.label_maks) {
      const ends = el('div', 'scale-ends');
      ends.append(el('span', '', s.label_min || ''), el('span', '', s.label_maks || ''));
      wrap.append(ends);
    }
    return wrap;
  }

  function texts(q) {
    const d = el('details', 'texts');
    d.append(el('summary', '', q.jawaban.length + ' jawaban'));
    const ul = el('ul');
    q.jawaban.forEach(function (j) {
      const li = el('li');
      li.append(el('span', '', j.isi));
      if (j.nama) li.append(el('small', '', j.nama));
      ul.append(li);
    });
    d.append(ul);
    return d;
  }

  // q: satu pertanyaan hasil ringkasan dari server. admin = tampilkan isi jawaban teks.
  function question(q, admin) {
    const card = el('section', 'qres');
    const h = el('h3', '', q.teks);
    card.append(h);
    const meta = el('p', 'qmeta', q.n + ' yang menjawab' + (q.tipe === 'centang' ? ' (boleh pilih lebih dari satu)' : ''));
    card.append(meta);
    if (admin && (q.disembunyikan || q.tampil_dashboard === false)) {
      const tags = [];
      if (q.disembunyikan) tags.push('disembunyikan dari form');
      if (q.tampil_dashboard === false) tags.push('tidak tampil di dashboard publik');
      card.append(el('p', 'tagline', tags.join(' · ')));
    }
    if (!q.n) {
      card.append(el('p', 'none', 'Belum ada jawaban.'));
    } else if (q.opsi) {
      card.append(bars(q));
    } else if (q.skala) {
      card.append(scale(q));
    } else if (q.jawaban) {
      card.append(texts(q));
    } else {
      card.append(el('p', 'none', 'Isi jawaban tidak ditampilkan di halaman publik.'));
    }
    return card;
  }

  App.charts = { question: question };
})();
