/* AGHFAHRI — dashboard publik */
(function () {
  'use strict';
  const $ = function (id) { return document.getElementById(id); };
  const el = App.el;
  const slug = new URLSearchParams(location.search).get('f') || '';
  const stage = $('stage');
  let last = '';
  let timer = 0;

  const themeBtn = $('themeBtn');
  themeBtn.append(App.svg('moon', 'moon'), App.svg('sun', 'sun'));
  themeBtn.addEventListener('click', App.theme.toggle);
  $('home').append(App.svg('back'), document.createTextNode('Beranda'));

  function note(title, text, retry) {
    const c = el('div', 'card');
    c.append(el('h2', '', title));
    if (text) c.append(el('p', 'hint', text));
    if (retry) {
      const b = el('button', 'btn', 'Coba lagi'); b.type = 'button';
      b.addEventListener('click', function () { load(false); });
      c.append(b);
    }
    return c;
  }

  function render(d) {
    document.title = 'Hasil: ' + d.form.judul;
    $('dtitle').textContent = d.form.judul;
    const desc = $('ddesc'); desc.replaceChildren();
    if (d.form.deskripsi) desc.append(App.rich(d.form.deskripsi));
    desc.hidden = !d.form.deskripsi;
    $('dhead').hidden = false;

    const frag = document.createDocumentFragment();
    const stat = el('section', 'card stat');
    const num = el('div', 'num');
    num.append(el('strong', '', String(d.total)), el('span', '', d.total === 1 ? 'responden' : 'responden'));
    const upd = el('div', 'upd');
    if (d.terakhir) upd.append(el('div', '', 'Jawaban terakhir masuk ' + d.terakhir.slice(0, 16)));
    const refresh = el('button', 'btn', 'Perbarui'); refresh.type = 'button';
    refresh.addEventListener('click', function () { load(false, refresh); });
    upd.append(refresh);
    stat.append(num, upd);
    frag.append(stat);

    if (!d.blocks.length) {
      frag.append(note('Belum ada hasil yang ditampilkan.', 'Pertanyaan belum dipilih untuk tampil di dashboard.'));
    } else if (!d.total) {
      frag.append(note('Belum ada jawaban.', 'Hasil akan muncul di sini setelah ada yang mengisi.'));
    } else {
      d.blocks.forEach(function (b) {
        const sec = el('section', 'card dsec');
        const label = (d.form.label_blok || 'Soal') + ' ' + b.no;
        sec.append(el('h2', '', b.judul ? label + ' · ' + b.judul : label));
        b.questions.forEach(function (q) { sec.append(App.charts.question(q, false)); });
        frag.append(sec);
      });
    }
    stage.replaceChildren(frag);
  }

  async function load(first, btn) {
    if (!/^[a-z0-9-]{1,60}$/.test(slug)) {
      stage.replaceChildren(note('Dashboard tidak ditemukan.', 'Alamat tidak lengkap atau salah.'));
      App.splash.hide(400);
      return;
    }
    if (btn) btn.classList.add('is-busy');
    try {
      const d = await App.get({ action: 'dashboard', f: slug }, { silent: !first && !btn });
      const s = JSON.stringify(d);
      if (s !== last) { last = s; render(d); }
      if (first) App.splash.hide(1000);
      clearInterval(timer);
      timer = setInterval(function () { if (!document.hidden) load(false); }, 45000);
    } catch (e) {
      if (first) App.splash.hide(400);
      if (!last) {
        $('dhead').hidden = true;
        stage.replaceChildren(e.code === 'NOTFOUND'
          ? note('Dashboard belum dibuka.', 'Hasil form ini belum ditampilkan untuk umum.')
          : note('Hasil belum bisa dimuat.', e.message, true));
      }
    } finally {
      if (btn) btn.classList.remove('is-busy');
    }
  }

  load(true);
})();
