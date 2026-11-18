(() => {
  'use strict';

  const toggle = document.getElementById('ki-filter-switch');
  const status = document.getElementById('ki-filter-status');
  const adsToggle = document.getElementById('ads-filter-switch');
  const adsStatus = document.getElementById('ads-filter-status');
  if (!toggle || !status) return;

  const storageKey = 'linkedin-experiment-show-ai-posts';
  const toast = document.createElement('div');
  toast.className = 'ki-filter-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.setAttribute('aria-atomic', 'true');
  document.body.appendChild(toast);
  let toastTimer;
  const postSelector = '[role="listitem"][componentkey^="update-card-focus"]';
  // Word boundaries prevent matches inside words such as "Mail" or "Kinder".
  const aiTerms = /(?:\b(?:ki|ai|chatgpt|claude|anthropic|openai|gemini|copilot|llms?|midjourney|deepseek)\b|künstlich\w*\s+intelligenz|artificial\s+intelligence|generativ\w*\s+(?:ki|ai)|machine\s+learning|large\s+language\s+models?)/iu;
  let showAiPosts = false;
  let showAds = true;
  const adsStorageKey = 'linkedin-experiment-show-ads';
  try { showAiPosts = localStorage.getItem(storageKey) === 'true'; } catch (_) { /* Storage is optional. */ }
  try { showAds = localStorage.getItem(adsStorageKey) !== 'false'; } catch (_) { /* Storage is optional. */ }

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

  const posts = Array.from(document.querySelectorAll(postSelector)).map(post => ({
    post,
    ai: isAiPost(post),
    ad: Array.from(post.querySelectorAll('p')).some(p => p.textContent.trim() === 'Anzeige'
      && !p.closest('[componentkey^="replaceableComment"], [id^="replaceableComment"]'))
  }));

  function applyFilter() {
    toggle.setAttribute('aria-checked', String(showAiPosts));
    adsToggle.setAttribute('aria-checked', String(showAds));
    let visibleCount = 0;
    posts.forEach(({post, ai, ad}) => {
      const hidden = (!showAiPosts && ai) || (!showAds && ad);
      if (!hidden) visibleCount += 1;
      // Hide the outer feed slot too, so filtered posts leave no empty gaps.
      const slot = post.closest('[data-lazy-mount-id]') || post;
      slot.toggleAttribute('data-ki-filter-hidden', hidden);
    });
    status.textContent = showAiPosts
      ? 'KI-Beiträge werden angezeigt.'
      : 'KI-Beiträge sind ausgeblendet.';
    adsStatus.textContent = showAds ? 'Anzeigen werden angezeigt.' : 'Anzeigen sind ausgeblendet.';
    const countText = `${visibleCount}/${posts.length} Beiträgen`;
    document.getElementById('ki-filter-count').textContent = countText;
    document.getElementById('ads-filter-count').textContent = countText;
    return visibleCount;
  }

  function changeFilter(kind) {
    const before = applyFilter();
    if (kind === 'ai') showAiPosts = !showAiPosts;
    else showAds = !showAds;
    try {
      localStorage.setItem(storageKey, String(showAiPosts));
      localStorage.setItem(adsStorageKey, String(showAds));
    } catch (_) { /* Storage is optional. */ }
    const after = applyFilter();
    const percentage = posts.length ? Math.round(Math.abs(after - before) / posts.length * 100) : 0;
    const showing = kind === 'ai' ? showAiPosts : showAds;
    clearTimeout(toastTimer);
    toast.textContent = `${percentage} % der Beiträge ${showing ? 'eingeblendet' : 'ausgeblendet'}.`;
    toast.classList.add('is-visible');
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3000);
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
})();
