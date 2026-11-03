/* Static (2D) view enhancements.
 * Runs only when the page is in flat mode; the 3D room never loads this path.
 * It adds no content of its own beyond labels: every project, role, bio line
 * and contact link shown here is read from the page's existing markup.
 */
(() => {
  'use strict';

  const root = document.documentElement;
  if (!root.classList.contains('flat')) return;
  root.classList.add('s-js');

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const behavior = reduce ? 'auto' : 'smooth';
  const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const forced = new URLSearchParams(location.search).has('static');
  const pad = n => String(n).padStart(2, '0');
  const ARROW_UR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>';
  const ARROW_DN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6"/></svg>';

  const go3D = () => {
    if (window.__redesign && typeof window.__redesign.open3D === 'function') window.__redesign.open3D();
    else location.assign(location.pathname);
  };

  const init = () => {
    const main = $('main');
    const hero = $('header.ui');
    const nav = $('nav.index');
    if (!main || !hero || !nav) return;

    /* The CV buttons stay on the page but are inert for now: no href, no download.
       Wire them to the new file later by giving the anchors an href + download. */
    const cvAttrs = ' role="button" aria-disabled="true"';

    /* The pieces the page script reveals in flat mode, and the tab panes it leaves hidden. */
    $$('.tv .pane').forEach(p => { p.hidden = false; });

    /* ---------- Top bar: brand, the existing section nav, actions ---------- */
    const top = document.createElement('div');
    top.className = 's-top';
    top.innerHTML =
      '<div class="s-top-in">' +
      '<a class="s-brand" href="#top" aria-label="Outsider, back to top"><i></i>Outsider</a>' +
      '<div class="s-actions">' +
      `<a class="s-btn ghost"${cvAttrs}>CV</a>` +
      `<button class="s-btn primary" type="button" id="s-enter3d">Enter 3D room ${ARROW_UR}</button>` +
      '</div></div>';
    const inner = $('.s-top-in', top);
    inner.insertBefore(nav, $('.s-actions', top));
    document.body.prepend(top);
    $('#s-enter3d', top).addEventListener('click', go3D);
    $('.s-brand', top).addEventListener('click', e => {
      e.preventDefault();
      scrollTo({ top: 0, behavior });
    });

    /* ---------- Hero: actions and quick facts ---------- */
    const cta = document.createElement('div');
    cta.className = 's-cta';
    cta.innerHTML =
      `<a class="s-btn primary lg" href="#projects">View projects ${ARROW_DN}</a>` +
      '<a class="s-btn ghost lg" href="#contact">Get in touch</a>' +
      `<a class="s-btn ghost lg"${cvAttrs}>Download CV</a>`;
    hero.appendChild(cta);

    const cases = $$('.case');
    const roles = $$('#experience .note');
    const place = (($('.hero-meta', hero) || {}).textContent || '').split('·').pop().trim();
    const stats = document.createElement('div');
    stats.className = 's-stats';
    stats.innerHTML =
      `<div class="s-stat"><b>${pad(cases.length)}</b><span>Projects</span></div>` +
      `<div class="s-stat"><b>${pad(roles.length)}</b><span>Roles</span></div>` +
      `<div class="s-stat"><b data-s-time>--:--</b><span>${place ? esc(place) + ' · ' : ''}PKT</span></div>`;
    hero.appendChild(stats);

    const timeEl = $('[data-s-time]', stats);
    const tick = () => {
      timeEl.textContent = new Date().toLocaleTimeString('en-GB', {
        timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit'
      });
    };
    tick();
    setInterval(tick, 15000);

    /* ---------- "Built with": every technology named in the projects ---------- */
    const techs = [];
    $$('.case .deps em').forEach(em => {
      const t = em.textContent.replace(/["“”]/g, '').trim();
      if (t && !techs.includes(t)) techs.push(t);
    });
    if (techs.length) {
      const strip = document.createElement('div');
      strip.className = 's-marquee';
      const set = (hidden) => techs.map(t => `<span${hidden ? ' aria-hidden="true"' : ''}>${esc(t)}</span>`).join('');
      strip.innerHTML =
        '<em>Built with</em><div class="s-track-wrap"><div class="s-track">' +
        set(false) + set(true) + '</div></div>';
      hero.after(strip);
    }

    /* ---------- Project cards: image frame, number, jump to the case study ---------- */
    const tiles = $$('.tile[data-p]');
    tiles.forEach((tile, i) => {
      const img = $('img', tile);
      if (img) {
        const frame = document.createElement('span');
        frame.className = 's-media';
        img.replaceWith(frame);
        frame.appendChild(img);
        const idx = document.createElement('span');
        idx.className = 's-idx';
        idx.textContent = pad(i + 1);
        frame.appendChild(idx);
        const nm = $('.nm', tile);
        if (nm) img.alt = nm.textContent.trim() + ' preview';
      }
      tile.addEventListener('click', () => {
        const c = document.getElementById('case-' + tile.dataset.p);
        if (!c) return;
        c.scrollIntoView({ behavior, block: 'start' });
        c.classList.remove('s-flash');
        void c.offsetWidth;
        c.classList.add('s-flash');
        setTimeout(() => c.classList.remove('s-flash'), 1600);
      });
    });

    /* ---------- Case studies: number and stack chips ---------- */
    if (cases.length) {
      const sub = document.createElement('div');
      sub.className = 's-sub';
      sub.textContent = 'Case studies';
      cases[0].before(sub);
    }
    cases.forEach((c, i) => {
      const body = $('.appbody', c);
      if (!body) return;
      const num = document.createElement('span');
      num.className = 's-case-num';
      num.textContent = `${pad(i + 1)} / ${pad(cases.length)}`;
      body.prepend(num);

      const stack = $$('.deps em', c).map(em => em.textContent.replace(/["“”]/g, '').trim()).filter(Boolean);
      const tag = $('.tagline', body);
      if (stack.length && tag) {
        const ul = document.createElement('ul');
        ul.className = 's-chips';
        ul.setAttribute('aria-label', 'Built with');
        ul.innerHTML = stack.map(t => `<li>${esc(t)}</li>`).join('');
        tag.after(ul);
        c.classList.add('s-has-chips');
      }
    });

    /* ---------- About: portrait, and a label on the chat card ---------- */
    const bio = $('#tv-bio');
    if (bio) {
      const img = new Image();
      img.className = 's-portrait';
      img.alt = 'Portrait of Outsider';
      img.width = 757;
      img.height = 757;
      img.decoding = 'async';
      img.loading = 'lazy';
      img.src = '/headshot.jpg';
      img.addEventListener('error', () => img.remove());
      bio.prepend(img);
    }
    const chat = $('#tv-chat');
    if (chat) {
      const head = document.createElement('div');
      head.className = 's-chat-head';
      head.innerHTML = '<i></i>Ask my AI';
      chat.prepend(head);
    }

    /* ---------- Contact: one line of invitation ---------- */
    const who = $('.pwho');
    if (who) {
      const line = document.createElement('p');
      line.className = 's-cta-line';
      line.textContent = "Have a project in mind? Let's talk.";
      who.prepend(line);
    }

    /* ---------- Footer ---------- */
    const foot = document.createElement('footer');
    foot.className = 's-footer';
    foot.innerHTML =
      `<span>&copy; ${new Date().getFullYear()} Outsider${place ? ' · ' + esc(place) : ''}</span>` +
      '<nav aria-label="Footer">' +
      '<a href="#projects">Projects</a><a href="#experience">Experience</a>' +
      '<a href="#about">About</a><a href="#contact">Contact</a>' +
      '<button type="button" data-s-top>Back to top &uarr;</button>' +
      '<button type="button" data-s-3d>Enter the 3D room &nearr;</button>' +
      '</nav>' +
      (forced ? '' : '<small>This is the lightweight version, shown because this device can&rsquo;t run the 3D room.</small>');
    main.appendChild(foot);
    $('[data-s-top]', foot).addEventListener('click', () => scrollTo({ top: 0, behavior }));
    $('[data-s-3d]', foot).addEventListener('click', go3D);

    /* ---------- Music card appears only when something is playing ---------- */
    const music = $('#music');
    const title = $('#np-title');
    if (music && title) {
      const sync = () => {
        const t = title.textContent.trim();
        music.classList.toggle('s-live', !!t && t !== 'Nothing on right now');
      };
      new MutationObserver(sync).observe(title, { childList: true, characterData: true, subtree: true });
      sync();
    }

    /* ---------- Top bar state and current section ---------- */
    const marks = ['projects', 'experience', 'about', 'contact'].map(id => document.getElementById(id)).filter(Boolean);
    const buttons = $$('button[data-go]', nav);
    let queued = false;
    const update = () => {
      queued = false;
      top.classList.toggle('scrolled', scrollY > 8);
      const y = innerHeight * 0.38;
      let cur = null;
      for (const s of marks) {
        const r = s.getBoundingClientRect();
        if (r.top <= y && r.bottom > y) cur = s.id;
      }
      for (const b of buttons) {
        if (b.dataset.go === cur) b.setAttribute('aria-current', 'true');
        else b.removeAttribute('aria-current');
      }
    };
    const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
    addEventListener('scroll', queue, { passive: true });
    addEventListener('resize', queue);
    update();

    /* ---------- Reveal on scroll ---------- */
    const targets = [];
    const add = (nodes, step = 0) => nodes.forEach((el, i) => {
      if (!el) return;
      el.classList.add('s-reveal');
      if (step) el.style.setProperty('--d', (i % 3) * step + 's');
      targets.push(el);
    });
    add($$('.ui > *'), 0);
    $$('.ui > *').forEach((el, i) => el.style.setProperty('--d', i * 0.09 + 's'));
    add($$('.s-marquee, .s-sub, .surface > .kicker, .board-head'));
    add($$('.tile'), 0.08);
    add($$('.case'));
    add($$('.board .note'));
    add([$('#tv-bio'), $('#tv-chat'), $('.pwho')]);
    add($$('.pgrid > *'), 0.07);
    add([foot]);

    const finish = el => setTimeout(() => el.classList.remove('s-reveal', 'in'), 1400);
    if (!('IntersectionObserver' in window)) {
      targets.forEach(el => el.classList.remove('s-reveal'));
    } else {
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add('in');
          io.unobserve(e.target);
          finish(e.target);
        }
      }, { threshold: 0.06, rootMargin: '0px 0px -4% 0px' });
      targets.forEach(el => io.observe(el));
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
