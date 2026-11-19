(() => {
  'use strict';

  const toggle = document.getElementById('ki-filter-switch');
  const status = document.getElementById('ki-filter-status');
  const adsToggle = document.getElementById('ads-filter-switch');
  const adsStatus = document.getElementById('ads-filter-status');
  if (!toggle || !status) return;

  const celebration = document.createElement('div');
  celebration.className = 'feed-celebration';
  const confetti = document.createElement('div');
  confetti.className = 'feed-confetti';
  confetti.setAttribute('aria-hidden', 'true');
  const message = document.createElement('div');
  message.className = 'feed-celebration-message';
  message.setAttribute('role', 'status');
  message.setAttribute('aria-live', 'polite');
  message.setAttribute('aria-atomic', 'true');
  celebration.append(confetti, message);
  document.body.appendChild(celebration);
  let celebrationTimer;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function dismissCelebration() {
    clearTimeout(celebrationTimer);
    celebration.classList.remove('is-visible');
    confetti.replaceChildren();
    message.replaceChildren();
  }

  function celebrate(kind, count) {
    dismissCelebration();
    const title = document.createElement('h2');
    title.textContent = kind === 'ai' ? 'AI Free Feed' : 'Ad Free Feed';
    const detail = document.createElement('p');
    detail.textContent = `${count} ${count === 1 ? 'Beitrag' : 'Beiträge'} ausgeblendet`;
    message.append(title, detail);
    if (!reducedMotion.matches) {
      const colors = ['#0a66c2', '#65b9ff', '#ffd36b', '#ff849c', '#75d6bb', '#a594ed'];
      const spread = Math.min(window.innerWidth * .42, 470);
      const particles = document.createDocumentFragment();
      for (let i = 0; i < 84; i += 1) {
        const piece = document.createElement('span');
        piece.className = 'feed-confetti-piece';
        const angle = Math.random() * Math.PI * 2;
        const distance = .35 + Math.random() * .65;
        piece.style.setProperty('--x', `${Math.cos(angle) * spread * distance}px`);
        piece.style.setProperty('--y', `${Math.sin(angle) * 300 * distance - 110}px`);
        piece.style.setProperty('--rotation', `${Math.random() * 1080 - 540}deg`);
        piece.style.setProperty('--duration', `${1400 + Math.random() * 1000}ms`);
        piece.style.setProperty('--delay', `${Math.random() * 160}ms`);
        piece.style.backgroundColor = colors[i % colors.length];
        if (i % 3 === 0) piece.style.borderRadius = '50%';
        particles.appendChild(piece);
      }
      confetti.appendChild(particles);
    }
    // Restart the message animation when both switches are used in quick succession.
    void celebration.offsetWidth;
    celebration.classList.add('is-visible');
    celebrationTimer = setTimeout(() => celebration.classList.remove('is-visible'), 2800);
  }
  const postSelector = '[role="listitem"][componentkey^="update-card-focus"]';
  // Word boundaries prevent matches inside words such as "Mail" or "Kinder".
  const aiTerms = /(?:\b(?:ki|ai|chatgpt|claude|anthropic|openai|gemini|copilot|llms?|midjourney|deepseek)\b|künstlich\w*\s+intelligenz|artificial\s+intelligence|generativ\w*\s+(?:ki|ai)|machine\s+learning|large\s+language\s+models?)/iu;
  let showAiPosts = true;
  let showAds = true;

  function isAiPost(post) {
    // Search post content and attachment captions, excluding author bios and comments.
    const content = Array.from(post.querySelectorAll('[data-testid="expandable-text-box"], a[href], img[alt]'))
      .filter(node => !node.closest('[componentkey^="replaceableComment"], [id^="replaceableComment"]'))
      .filter(node => node.tagName !== 'A' || !/linkedin\.com\/(?:in|company|showcase|school)\//i.test(node.href))
      .map(node => node.tagName === 'IMG' ? node.getAttribute('alt') : node.textContent)
      .join(' ')
      .normalize('NFKC');
    return aiTerms.test(content);
  }

  const posts = Array.from(document.querySelectorAll(postSelector)).map(post => {
    // Saved feed slots use display: contents, so give each one a box that can collapse.
    const slot = post.closest('[data-lazy-mount-id]') || post;
    const shell = document.createElement('div');
    shell.className = 'feed-filter-slot';
    slot.before(shell);
    shell.appendChild(slot);
    return {
      post, shell, hidden: false, animation: null,
      ai: isAiPost(post),
      ad: Array.from(post.querySelectorAll('p')).some(p => p.textContent.trim() === 'Anzeige'
        && !p.closest('[componentkey^="replaceableComment"], [id^="replaceableComment"]'))
    };
  });
  let visiblePostCount = 0;

  function transitionPost(entry, hidden, animate) {
    if (entry.hidden === hidden) return;
    entry.hidden = hidden;
    const {shell} = entry;
    const startHeight = shell.getBoundingClientRect().height;
    const startOpacity = parseFloat(getComputedStyle(shell).opacity);
    if (entry.animation) entry.animation.cancel();
    entry.animation = null;
    shell.removeAttribute('data-ki-filter-hidden');
    if (!animate || reducedMotion.matches) {
      shell.toggleAttribute('data-ki-filter-hidden', hidden);
      return;
    }
    const fullHeight = shell.getBoundingClientRect().height;
    const animation = shell.animate([
      {height: `${startHeight}px`, opacity: startHeight ? startOpacity : 0,
        transform: startHeight ? 'translateY(0)' : 'translateY(-12px)'},
      {height: hidden ? '0px' : `${fullHeight}px`, opacity: hidden ? 0 : 1,
        transform: hidden ? 'translateY(-12px)' : 'translateY(0)'}
    ], {duration: 560, easing: 'cubic-bezier(.4, 0, .2, 1)', fill: 'both'});
    entry.animation = animation;
    animation.onfinish = () => {
      if (entry.animation !== animation) return;
      shell.toggleAttribute('data-ki-filter-hidden', entry.hidden);
      animation.cancel();
      entry.animation = null;
    };
  }

  function applyFilter(animate = false) {
    toggle.setAttribute('aria-checked', String(showAiPosts));
    adsToggle.setAttribute('aria-checked', String(showAds));
    let visibleCount = 0;
    posts.forEach(entry => {
      const {ai, ad} = entry;
      const hidden = (!showAiPosts && ai) || (!showAds && ad);
      if (!hidden) visibleCount += 1;
      transitionPost(entry, hidden, animate);
    });
    status.textContent = showAiPosts
      ? 'KI-Beiträge werden angezeigt.'
      : 'KI-Beiträge sind ausgeblendet.';
    adsStatus.textContent = showAds ? 'Anzeigen werden angezeigt.' : 'Anzeigen sind ausgeblendet.';
    const countText = `${visibleCount}/${posts.length} Beiträgen`;
    document.getElementById('ki-filter-count').textContent = countText;
    document.getElementById('ads-filter-count').textContent = countText;
    visiblePostCount = visibleCount;
    return visibleCount;
  }

  function changeFilter(kind) {
    const before = visiblePostCount;
    if (kind === 'ai') showAiPosts = !showAiPosts;
    else showAds = !showAds;
    const after = applyFilter(true);
    const showing = kind === 'ai' ? showAiPosts : showAds;
    if (showing) dismissCelebration();
    else celebrate(kind, before - after);
  }
  toggle.addEventListener('click', () => changeFilter('ai'));
  adsToggle.addEventListener('click', () => changeFilter('ads'));

  function highlightAiTerms() {
    const terms = new RegExp(aiTerms.source, 'giu');
    document.querySelectorAll(postSelector).forEach(post => {
      const walker = document.createTreeWalker(post, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (!node.parentElement.closest('script, style, mark, svg, [aria-hidden="true"]')) nodes.push(node);
      }
      nodes.forEach(node => {
        const text = node.nodeValue;
        const matches = Array.from(text.matchAll(terms));
        if (!matches.length) return;
        const fragment = document.createDocumentFragment();
        let offset = 0;
        matches.forEach(match => {
          fragment.appendChild(document.createTextNode(text.slice(offset, match.index)));
          const mark = document.createElement('mark');
          mark.className = 'ki-term-highlight';
          mark.textContent = match[0];
          fragment.appendChild(mark);
          offset = match.index + match[0].length;
        });
        fragment.appendChild(document.createTextNode(text.slice(offset)));
        node.replaceWith(fragment);
      });
    });
  }

  highlightAiTerms();
  applyFilter();
  const filterCards = document.querySelectorAll('.ki-filter-card');
  filterCards.forEach(card => card.classList.add('is-introduced'));
  setTimeout(() => filterCards.forEach(card => card.classList.remove('is-introduced')), 3600);
})();
