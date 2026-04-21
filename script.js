/* Nikhil portfolio — data-driven site + interactive shell. No deps. */

(() => {
  'use strict';

  /* ================================================================
     Helpers
     ================================================================ */
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const el = (tag, attrs = {}, ...children) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) n.setAttribute(k, v);
    }
    for (const c of children) {
      if (c == null || c === false) continue;
      n.append(c.nodeType ? c : document.createTextNode(String(c)));
    }
    return n;
  };
  const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g,
    c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const parseYM = (ym) => {
    if (!ym) return null;
    const [y, m] = String(ym).split('-').map(Number);
    return { y, m };
  };
  const formatMonth = (ym) => {
    const d = parseYM(ym);
    if (!d) return 'Present';
    return `${MONTHS[d.m - 1]} ${d.y}`;
  };
  const monthsBetween = (startYm, endYm) => {
    const s = parseYM(startYm);
    if (!s) return 0;
    const now = new Date();
    const e = parseYM(endYm) || { y: now.getFullYear(), m: now.getMonth() + 1 };
    return (e.y - s.y) * 12 + (e.m - s.m);
  };
  const formatDuration = (months) => {
    if (months < 1) return '< 1 mo';
    const y = Math.floor(months / 12);
    const m = months % 12;
    if (y === 0) return `${m} mo`;
    if (m === 0) return `${y} yr`;
    return `${y} yr ${m} mo`;
  };

  /* ================================================================
     Load data
     ================================================================ */
  let data = null;

  const loadData = async () => {
    try {
      const res = await fetch('data.json', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = await res.json();
    } catch (err) {
      console.error('Failed to load data.json:', err);
      data = { identity: { name: 'Error', role: 'Could not load data.json' },
               bio: ['Serve this site over HTTP (not file://). Try: python3 -m http.server'],
               skills: [], certifications: [], experience: [], projects: [],
               contact: {} };
    }
  };

  /* ================================================================
     Render sections
     ================================================================ */
  const render = () => {
    /* identity */
    const name   = data.identity.name   || 'Nikhil';
    const role   = data.identity.role   || 'CyberSecurity Consultant';
    const handle = data.identity.handle || 'nikhil';
    $('#hero-name').textContent = name;
    $('#hero-name').setAttribute('data-text', name);
    $('#hero-role').textContent = `// ${role}`;
    $('#nav-handle').textContent = handle;
    document.title = `${name} — ${role}`;

    const akaEl = $('#hero-aka');
    const aka = (data.identity.aka || '').trim();
    if (aka) {
      const sp = aka.indexOf(' ');
      akaEl.innerHTML = sp > 0
        ? `<span class="aka-prefix">${escapeHtml(aka.slice(0, sp))}</span> <span class="aka-handle">${escapeHtml(aka.slice(sp + 1))}</span>`
        : `<span class="aka-handle">${escapeHtml(aka)}</span>`;
      akaEl.hidden = false;
    } else {
      akaEl.hidden = true;
      akaEl.textContent = '';
    }

    /* bio */
    const bio = $('#bio');
    bio.innerHTML = '';
    (data.bio || []).forEach(p => bio.append(el('p', { text: p })));

    /* skills */
    const sl = $('#skills-list');
    sl.innerHTML = '';
    (data.skills || []).forEach(s => sl.append(el('li', { text: s })));

    /* certs */
    const cl = $('#cert-list');
    cl.innerHTML = '';
    (data.certifications || []).forEach(c => {
      const name = el('span', { class: 'cert-name' }, c.name);
      if (c.full) name.append(el('span', { class: 'cert-sub', text: ` — ${c.full}` }));
      cl.append(el('li', {},
        name,
        el('span', { class: 'cert-issuer', text: c.issuer || '' })
      ));
    });

    /* blog */
    const bl = $('#blog-list');
    bl.innerHTML = '';
    const posts = data.blog || [];
    if (posts.length === 0) {
      bl.append(el('div', { class: 'empty-card' },
        el('p', { text: '// no posts yet — come back soon.' })
      ));
    } else {
      posts.forEach(p => {
        const tags = el('div', { class: 'tags' });
        (p.tags || []).forEach(t => tags.append(el('span', { text: t })));
        const head = el('div', { class: 'project-head' },
          el('h3', { text: p.name }),
          el('span', { class: 'arrow', 'aria-hidden': 'true', text: '↗' })
        );
        const card = el('a', {
          class: 'project',
          href: p.url || '#',
          target: (p.url && p.url !== '#') ? '_blank' : null,
          rel: 'noopener',
        }, head, el('p', { text: p.description || '' }), tags);
        bl.append(card);
      });
    }

    /* experience */
    const exp = $('#exp-list');
    exp.innerHTML = '';
    (data.experience || []).forEach(e => {
      const dur = formatDuration(monthsBetween(e.start, e.end));
      const range = `${formatMonth(e.start)} — ${formatMonth(e.end)}`;
      const time = el('div', { class: 'time' },
        range,
        el('span', { class: 'dur', text: dur })
      );
      exp.append(el('li', {},
        time,
        el('div', { class: 'role', text: e.role || '' }),
        el('div', { class: 'place', text: e.company || '' }),
        el('p', { text: e.description || '' })
      ));
    });

    /* contact */
    const cc = $('#contact-list');
    cc.innerHTML = '';
    const fields = [
      ['email',    data.contact?.email,    data.contact?.email ? `mailto:${data.contact.email}` : null],
      ['linkedin', data.contact?.linkedin, data.contact?.linkedin],
      ['x',        data.contact?.x,       data.contact?.x],
      ['github',   data.contact?.github,  data.contact?.github],
    ];
    fields.forEach(([key, value, href]) => {
      if (!value) return;
      const display = (key === 'email') ? value
                      : value.replace(/^https?:\/\//, '').replace(/\/$/, '');
      cc.append(el('li', {},
        el('span', { class: 'key', text: key }),
        el('a', { href, target: href?.startsWith('http') ? '_blank' : null, rel: 'noopener', text: display })
      ));
    });
  };

  /* ================================================================
     Hero typing animation
     ================================================================ */
  const startTyping = () => {
    const phrases = [
      'breaking web apps (with permission :p).',
      'pivoting through Active Directory.',
      'pwning Android & iOS apps.',
      'hunting subdomains at 3am.',
      'turning recon into reports.',
      'shipping fixes, not just findings.',
    ];
    const typed = $('#typed');
    if (!typed) return;
    let pi = 0, ci = 0, del = false;
    const tick = () => {
      const cur = phrases[pi];
      if (del) {
        typed.textContent = cur.slice(0, ci--);
        if (ci < 0) { del = false; pi = (pi + 1) % phrases.length; return setTimeout(tick, 420); }
      } else {
        typed.textContent = cur.slice(0, ci++);
        if (ci > cur.length) { del = true; return setTimeout(tick, 1800); }
      }
      setTimeout(tick, del ? 25 : 55);
    };
    tick();
  };

  /* ================================================================
     Active nav on scroll + fade-in
     ================================================================ */
  const wireScroll = () => {
    const io = new IntersectionObserver(
      (entries, obs) => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      }),
      { threshold: 0.08, rootMargin: '0px 0px -5% 0px' }
    );
    $$('.section').forEach(s => { s.classList.add('fade-in'); io.observe(s); });

    const sections = $$('main section[id]');
    const links = $$('.nav nav a');
    const byId = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
    let ticking = false;
    const setActive = () => {
      ticking = false;
      const y = window.scrollY + 180;
      let cur = sections[0]?.id;
      for (const s of sections) if (s.offsetTop <= y) cur = s.id;
      links.forEach(a => a.classList.remove('active'));
      const a = byId.get(cur); if (a) a.classList.add('active');
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(setActive); ticking = true; }
    }, { passive: true });
    setActive();
  };

  /* ================================================================
     Interactive shell
     ================================================================ */
  const wireShell = () => {
    const term    = $('#shell-term');
    const body    = $('#shell-body');
    const history = $('#shell-history');
    const input   = $('#shell-input');
    const form    = $('#shell-form');
    if (!term || !input) return;

    const cmdHistory = [];
    let histPos = -1;

    const sizeInput = () => {
      input.style.width = Math.max(input.value.length, 1) + 'ch';
    };

    const printLine = (html, cls = '') => {
      const d = el('div', { class: `line ${cls}` });
      d.innerHTML = html;
      history.append(d);
    };
    const printPrompt = (cmd) => {
      printLine(
        `<span class="user">visitor@nikhil</span><span class="sep">:</span><span class="path">~</span><span class="sep">$</span> <span class="cmd">${escapeHtml(cmd)}</span>`
      );
    };
    const printDivider = () => printLine('', 'divider');
    const scrollDown = () => { body.scrollTop = body.scrollHeight; };
    const clearShell = () => { history.innerHTML = ''; };

    const banner = () => {
      printLine(`<span class="head">// welcome to nikhil's shell</span>`);
      printLine(`<span class="dim">a tiny interactive prompt — type <span class="ok">help</span> for commands.</span>`);
      printDivider();
    };

    const commands = {
      help: () => [
        { html: `<span class="head">available commands</span>` },
        `  <span class="ok">help</span>, ?          — show this message`,
        `  <span class="ok">whoami</span>           — short identity`,
        `  <span class="ok">about</span>            — full bio`,
        `  <span class="ok">skills</span>           — skills list`,
        `  <span class="ok">certs</span>            — certifications`,
        `  <span class="ok">experience</span>, exp  — work experience`,
        `  <span class="ok">blog</span>, posts      — blog posts`,
        `  <span class="ok">contact</span>          — contact info`,
        `  <span class="ok">ls</span>               — list sections`,
        `  <span class="ok">cat &lt;file&gt;</span>       — show file content`,
        `  <span class="ok">date</span>             — current date/time`,
        `  <span class="ok">pwd</span>              — working directory`,
        `  <span class="ok">uname</span>            — system info`,
        `  <span class="ok">history</span>          — command history`,
        `  <span class="ok">echo &lt;msg&gt;</span>        — echo text`,
        `  <span class="ok">clear</span>, cls       — clear terminal`,
        `  <span class="ok">exit</span>             — (try it)`,
      ],
      '?':       () => commands.help(),
      whoami:    () => [`${data.identity.name} — ${data.identity.role}`],
      about:     () => data.bio,
      skills:    () => [
        { html: `<span class="head">skills/</span>` },
        ...data.skills.map(s => `  ▸ ${escapeHtml(s)}`),
      ],
      certs:         () => commands.certifications(),
      certifications: () => [
        { html: `<span class="head">certifications/</span>` },
        ...data.certifications.map(c =>
          `  ▸ <span class="ok">${escapeHtml(c.name)}</span>` +
          (c.full   ? ` — ${escapeHtml(c.full)}` : '') +
          (c.issuer ? ` <span class="dim">(${escapeHtml(c.issuer)})</span>` : '')
        ),
      ],
      experience: () => {
        const out = [{ html: `<span class="head">experience.log</span>` }];
        data.experience.forEach(e => {
          const dur = formatDuration(monthsBetween(e.start, e.end));
          out.push(`  <span class="ok">${escapeHtml(e.role)}</span> @ ${escapeHtml(e.company)}`);
          out.push(`  <span class="dim">${formatMonth(e.start)} — ${formatMonth(e.end)} · ${dur}</span>`);
          if (e.description) out.push(`  ${escapeHtml(e.description)}`);
          out.push('');
        });
        return out;
      },
      exp:      () => commands.experience(),
      blog: () => {
        const posts = data.blog || [];
        if (posts.length === 0) {
          return [{ html: `<span class="head">blog/</span>` }, { cls: 'dim', text: '  (no posts yet)' }];
        }
        const out = [{ html: `<span class="head">blog/</span>` }];
        posts.forEach(p => {
          out.push(`  <span class="ok">${escapeHtml(p.name)}</span>`);
          if (p.description) out.push(`    ${escapeHtml(p.description)}`);
          if (p.tags?.length) out.push(`    <span class="dim">[${p.tags.map(escapeHtml).join(', ')}]</span>`);
          if (p.url && p.url !== '#') out.push(`    <a href="${escapeHtml(p.url)}" target="_blank" rel="noopener">${escapeHtml(p.url)}</a>`);
          out.push('');
        });
        return out;
      },
      posts: () => commands.blog(),
      contact: () => {
        const out = [{ html: `<span class="head">contact</span>` }];
        const c = data.contact || {};
        if (c.email)    out.push(`  email    <a href="mailto:${escapeHtml(c.email)}">${escapeHtml(c.email)}</a>`);
        if (c.linkedin) out.push(`  linkedin <a href="${escapeHtml(c.linkedin)}" target="_blank" rel="noopener">${escapeHtml(c.linkedin.replace(/^https?:\/\//,''))}</a>`);
        if (c.x)        out.push(`  x        <a href="${escapeHtml(c.x)}" target="_blank" rel="noopener">${escapeHtml(c.x.replace(/^https?:\/\//,''))}</a>`);
        if (c.github)   out.push(`  github   <a href="${escapeHtml(c.github)}" target="_blank" rel="noopener">${escapeHtml(c.github.replace(/^https?:\/\//,''))}</a>`);
        return out;
      },
      ls: () => ['about.md  skills.md  certs.md  experience.log  blog/  contact.md'],
      cat: (args) => {
        const map = {
          'about.md': 'about', 'skills.md': 'skills', 'certs.md': 'certs',
          'certifications.md': 'certifications', 'experience.log': 'experience',
          'blog.md': 'blog', 'contact.md': 'contact',
        };
        const f = args[0];
        if (!f) return [{ cls: 'err', text: 'cat: missing file operand' }];
        const cmd = map[f];
        if (!cmd) return [{ cls: 'err', text: `cat: ${f}: No such file or directory` }];
        return commands[cmd]();
      },
      date:    () => [new Date().toString()],
      pwd:     () => ['/home/nikhil'],
      uname:   () => ['Linux nikhil 6.6.0-ops #1 SMP x86_64 GNU/Linux'],
      history: () => cmdHistory.length
                   ? cmdHistory.map((c, i) => `  ${String(i + 1).padStart(3)}  ${escapeHtml(c)}`)
                   : [{ cls: 'dim', text: '(empty)' }],
      echo:    (args) => [args.join(' ')],
      clear:   () => { clearShell(); return null; },
      cls:     () => { clearShell(); return null; },
      exit:    () => [{ cls: 'dim', text: 'logout' }, { cls: 'dim', text: '// just kidding — you can\'t leave.' }],
      sudo:    () => [{ cls: 'err', text: 'visitor is not in the sudoers file. This incident will be reported.' }],
      rm:      (args) => (args.includes('-rf') && (args.includes('/') || args.includes('/*')))
                         ? [{ cls: 'err', text: ':(){ :|:& };:' }, { cls: 'dim', text: '// nice try.' }]
                         : [{ cls: 'err', text: 'rm: operation not permitted' }],
    };

    const render = (result) => {
      if (result == null) return;
      (Array.isArray(result) ? result : [result]).forEach(r => {
        if (r == null || r === '') return printLine('&nbsp;');
        if (typeof r === 'string') return printLine(r);
        if (r.html) return printLine(r.html, r.cls || '');
        if (r.text !== undefined) return printLine(escapeHtml(r.text), r.cls || '');
      });
    };

    const run = (raw) => {
      const input = raw.trim();
      printPrompt(input || '');
      if (!input) { scrollDown(); return; }
      cmdHistory.push(input); histPos = cmdHistory.length;
      const [cmd, ...args] = input.split(/\s+/);
      const fn = commands[cmd.toLowerCase()];
      if (!fn) {
        printLine(`<span class="err">command not found: ${escapeHtml(cmd)}</span>. Type <span class="ok">help</span>.`);
      } else {
        render(fn(args));
      }
      scrollDown();
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = input.value;
      input.value = '';
      sizeInput();
      run(v);
    });

    input.addEventListener('input', sizeInput);

    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') {
        if (histPos > 0) histPos--;
        input.value = cmdHistory[histPos] || '';
        sizeInput();
        setTimeout(() => input.setSelectionRange(input.value.length, input.value.length), 0);
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        if (histPos < cmdHistory.length) histPos++;
        input.value = cmdHistory[histPos] || '';
        sizeInput();
        e.preventDefault();
      } else if (e.key === 'l' && (e.ctrlKey || e.metaKey)) {
        clearShell(); e.preventDefault();
      }
    });

    term.addEventListener('click', () => input.focus());

    sizeInput();
    banner();
  };

  /* ================================================================
     Boot
     ================================================================ */
  document.addEventListener('DOMContentLoaded', async () => {
    $('#year').textContent = new Date().getFullYear();
    await loadData();
    render();
    startTyping();
    wireShell();
    wireScroll();
  });
})();
