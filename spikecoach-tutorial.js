/*
 * SpikeCoach guided tutorial (plain JS, no dependencies).
 *
 * Public API: window.startSpikeCoachTutorial()
 * It only highlights and explains. Navigation reuses the app's own handlers by
 * activating the existing tab buttons / home button, so no routing logic is duplicated.
 */
(function () {
  'use strict';

  var STEPS = [
    {
      nav: 'home',
      target: '#spikecoachTabBtn',
      title: 'Home',
      text: "Use Open SpikeCoach Tab when you're in a VALORANT match. SpikeCoach can show live match statistics while you play and provide personalized recommendations after the match."
    },
    {
      nav: 'lineups',
      target: '.taskbar-item[data-section="lineups"]',
      title: 'Line-ups',
      text: 'Pick an agent and a map to study VALORANT line-ups for your utility.'
    },
    {
      nav: 'past-games',
      target: '.taskbar-item[data-section="past-games"]',
      title: 'Past Games',
      text: 'Look back at your recent matches, scan results and stats, and open details for a closer look.'
    },
    {
      nav: 'strategy',
      target: '.taskbar-item[data-section="strategy"]',
      title: 'Strategy',
      text: 'Choose a map, place agents and utility on it, and plan your strategy before you queue.'
    },
    {
      nav: 'analyze',
      target: '.taskbar-item[data-section="analyze"]',
      title: 'Analyze',
      text: 'Coming soon: learn from specific mistakes in your games and see what you could have done better.'
    },
    {
      nav: 'ai-coach',
      target: '.taskbar-item[data-section="ai-coach"]',
      title: 'AI Coach',
      text: 'Ask VALORANT questions about agents, maps, strategy, or improving, and get coaching-style answers.'
    },
    {
      nav: 'guess-rank',
      target: '.taskbar-item[data-section="guess-rank"]',
      title: 'Guess the Rank',
      text: "Watch a VALORANT clip and guess the player's rank to train your game sense."
    },
    {
      nav: 'home',
      target: '#homeScreenFab',
      title: 'Back to Home',
      text: 'Use this button any time to return to the home screen.'
    }
  ];

  var PAD = 6;
  var EDGE = 12;
  var GAP = 14;

  var state = null;

  function qs(selector) {
    return document.querySelector(selector);
  }

  // Programmatic activation of an existing app control. The app root is inert while the
  // tour runs, so lift that just for the call.
  function activate(el) {
    if (!el) return;
    var app = qs('.products-screen');
    var wasInert = !!(app && app.hasAttribute('inert'));
    if (wasInert) app.removeAttribute('inert');
    try {
      el.click();
    } finally {
      if (wasInert && app && state) app.setAttribute('inert', '');
    }
  }

  function goTo(nav) {
    if (nav === 'home') {
      var welcome = qs('#welcomeSection');
      if (welcome && welcome.classList.contains('active')) return;
      activate(qs('#homeScreenFab'));
      return;
    }
    var tab = qs('.taskbar-item[data-section="' + nav + '"]');
    if (tab && !tab.classList.contains('active')) activate(tab);
  }

  function buildDom() {
    var root = document.createElement('div');
    root.className = 'sc-tour-root';

    var blocker = document.createElement('div');
    blocker.className = 'sc-tour-blocker';

    var ring = document.createElement('div');
    ring.className = 'sc-tour-highlight';

    var card = document.createElement('div');
    card.className = 'sc-tour-card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'false');
    card.setAttribute('aria-label', 'SpikeCoach tutorial');
    card.innerHTML =
      '<div class="sc-tour-progress" aria-hidden="true"><span></span></div>' +
      '<div class="sc-tour-step"></div>' +
      '<h3 class="sc-tour-title"></h3>' +
      '<p class="sc-tour-text" aria-live="polite"></p>' +
      '<div class="sc-tour-actions">' +
        '<button type="button" class="sc-tour-skip" title="Skip tutorial (Esc)">Skip Tutorial</button>' +
        '<span class="sc-tour-nav">' +
          '<button type="button" class="sc-tour-btn sc-tour-back">Back</button>' +
          '<button type="button" class="sc-tour-btn sc-tour-btn-primary sc-tour-next">Next</button>' +
        '</span>' +
      '</div>';

    root.appendChild(blocker);
    root.appendChild(ring);
    root.appendChild(card);
    document.body.appendChild(root);

    return {
      root: root,
      ring: ring,
      card: card,
      progress: card.querySelector('.sc-tour-progress span'),
      stepLabel: card.querySelector('.sc-tour-step'),
      title: card.querySelector('.sc-tour-title'),
      text: card.querySelector('.sc-tour-text'),
      skip: card.querySelector('.sc-tour-skip'),
      back: card.querySelector('.sc-tour-back'),
      next: card.querySelector('.sc-tour-next')
    };
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
  }

  function position() {
    if (!state) return;
    var step = STEPS[state.index];
    var target = qs(step.target);
    if (!target) return;

    var r = target.getBoundingClientRect();
    var left = r.left - PAD;
    var top = r.top - PAD;
    var width = r.width + PAD * 2;
    var height = r.height + PAD * 2;

    var ring = state.dom.ring;
    ring.style.left = left + 'px';
    ring.style.top = top + 'px';
    ring.style.width = width + 'px';
    ring.style.height = height + 'px';

    var card = state.dom.card;
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var cw = card.offsetWidth;
    var ch = card.offsetHeight;
    var cx;
    var cy;

    if (top + height + GAP + ch + EDGE <= vh) {
      cy = top + height + GAP;
      cx = left + width / 2 - cw / 2;
    } else if (top - GAP - ch - EDGE >= 0) {
      cy = top - GAP - ch;
      cx = left + width / 2 - cw / 2;
    } else if (left - GAP - cw - EDGE >= 0) {
      cx = left - GAP - cw;
      cy = top + height / 2 - ch / 2;
    } else {
      cx = left + width + GAP;
      cy = top + height / 2 - ch / 2;
    }

    card.style.left = clamp(cx, EDGE, Math.max(EDGE, vw - cw - EDGE)) + 'px';
    card.style.top = clamp(cy, EDGE, Math.max(EDGE, vh - ch - EDGE)) + 'px';
  }

  function schedulePosition() {
    if (!state || state.rafPending) return;
    state.rafPending = true;
    window.requestAnimationFrame(function () {
      if (!state) return;
      state.rafPending = false;
      position();
    });
  }

  function showStep(index, direction) {
    if (!state) return;
    if (index < 0 || index >= STEPS.length) {
      endTutorial();
      return;
    }

    var step = STEPS[index];
    goTo(step.nav);

    if (!qs(step.target)) {
      // Target is missing in this build of the UI: skip it rather than break the tour.
      showStep(index + direction, direction);
      return;
    }

    state.index = index;
    var dom = state.dom;
    var last = index === STEPS.length - 1;
    dom.stepLabel.textContent = 'Step ' + (index + 1) + ' of ' + STEPS.length;
    dom.title.textContent = step.title;
    dom.text.textContent = step.text;
    dom.progress.style.width = ((index + 1) / STEPS.length * 100) + '%';
    dom.back.disabled = index === 0;
    dom.next.textContent = last ? 'Finish Tutorial' : 'Next';

    position();
    // Enable position transitions only after the first placement so nothing slides in from the corner.
    if (!dom.root.classList.contains('is-ready')) {
      window.requestAnimationFrame(function () {
        if (state) dom.root.classList.add('is-ready');
      });
    }
    // Sections animate in briefly after a tab change; re-measure once they settle.
    setTimeout(schedulePosition, 80);
    setTimeout(schedulePosition, 450);
    dom.next.focus({ preventScroll: true });
  }

  function endTutorial() {
    if (!state) return;
    var current = state;
    state = null;
    document.removeEventListener('keydown', current.onKey, true);
    window.removeEventListener('resize', current.onResize);
    if (current.dom.root.parentNode) current.dom.root.parentNode.removeChild(current.dom.root);
    var app = qs('.products-screen');
    if (app) app.removeAttribute('inert');
  }

  function startSpikeCoachTutorial() {
    if (state) return;
    if (!qs('.products-screen')) return;

    var dom = buildDom();
    state = {
      index: 0,
      dom: dom,
      rafPending: false,
      onResize: schedulePosition,
      onKey: function (e) {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          endTutorial();
        }
      }
    };

    var app = qs('.products-screen');
    if (app) app.setAttribute('inert', '');

    dom.skip.addEventListener('click', endTutorial);
    dom.back.addEventListener('click', function () {
      showStep(state.index - 1, -1);
    });
    dom.next.addEventListener('click', function () {
      if (state.index === STEPS.length - 1) {
        endTutorial();
      } else {
        showStep(state.index + 1, 1);
      }
    });

    document.addEventListener('keydown', state.onKey, true);
    window.addEventListener('resize', state.onResize);

    showStep(0, 1);
  }

  window.startSpikeCoachTutorial = startSpikeCoachTutorial;
})();
