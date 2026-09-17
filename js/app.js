// Ghost-O-Meter UI layer
//
// Everything here drives the screen: needle, lights, counter, panels.
// The game logic lives in ghost.js and calls the hooks at the bottom of this
// file (ghostAppeard / ghostFound / ghostDisappeared / needleMoved).
// jQuery and FastClick are gone; this is plain DOM.

(function () {
  'use strict';

  // --- helpers -----------------------------------------------------------

  function $(id) { return document.getElementById(id); }

  function setOpacity(id, value) {
    var el = $(id);
    if (el && el.style.opacity !== String(value)) {
      el.style.opacity = value;
    }
  }

  // --- stage scaling -----------------------------------------------------
  // The stage is a fixed 320x480 box. Scale it to fit the viewport while
  // keeping the aspect ratio, so the artwork looks right on any screen.

  function fitStage() {
    var stage = $('stage');
    if (!stage) { return; }
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var scale = Math.min(vw / 320, vh / 480);
    stage.style.transform = 'scale(' + scale + ')';
  }
  window.addEventListener('resize', fitStage);
  window.addEventListener('orientationchange', function () {
    setTimeout(fitStage, 100);
  });
  fitStage();

  // --- panel navigation --------------------------------------------------

  var PANELS = ['home', 'records', 'instructions', 'settings', 'about'];
  var NAV_CLASSES = ['meter', 'records', 'instructions', 'settings', 'about'];

  function showPanel(name) {
    if (PANELS.indexOf(name) === -1) { name = 'home'; }
    PANELS.forEach(function (id) {
      var el = $(id);
      if (el) { el.classList.toggle('current', id === name); }
    });
    // underline the active nav link (except on the meter itself)
    NAV_CLASSES.forEach(function (cls) {
      var links = document.querySelectorAll('.navigation a.' + cls);
      for (var i = 0; i < links.length; i++) {
        links[i].classList.toggle('underline', cls === name && name !== 'home');
      }
    });
    if (name === 'records') {
      updatePanel();
    }
  }
  window.showPanel = showPanel;

  document.addEventListener('click', function (ev) {
    var a = ev.target.closest ? ev.target.closest('a[data-panel]') : null;
    if (!a) { return; }
    ev.preventDefault();
    showPanel(a.getAttribute('data-panel'));
  });

  // --- settings links ----------------------------------------------------

  var reloadLink = $('reload-link');
  if (reloadLink) {
    reloadLink.addEventListener('click', function (ev) {
      ev.preventDefault();
      window.location.reload();
    });
  }

  var resetLink = $('reset-link');
  if (resetLink) {
    resetLink.addEventListener('click', function (ev) {
      ev.preventDefault();
      try { localStorage.clear(); } catch (e) { /* ignore */ }
      if (typeof resetLifetimeCounts === 'function') { resetLifetimeCounts(); }
      updateCounters(0, 0);
      var status = $('reset-status');
      if (status) {
        status.textContent = 'App reset successfully.';
        setTimeout(function () { status.textContent = ''; }, 3000);
      }
    });
  }

  // --- needle & lights ---------------------------------------------------

  // Called every ~150ms by ghost.js while a ghost exists.
  // currentPosition: needle with random jitter (what the user sees)
  // actualPosition:  true 0-100 reading (drives lights, vibration, button glow)
  var lastVibrate = 0;

  function needleMoved(currentPosition, actualPosition) {
    // glowing home button when the reading is strong
    setOpacity('homeb2', actualPosition > 50 ? 1 : 0);

    // buzz when we are on top of a ghost (Android; iOS Safari has no vibrate)
    if (actualPosition > 70 && navigator.vibrate) {
      var now = Date.now();
      if (now - lastVibrate > 2000) {
        lastVibrate = now;
        try { navigator.vibrate(2000); } catch (e) { /* ignore */ }
      }
    }

    // needle sweep: 0 -> -37deg, 100 -> +40deg
    var adjustedPosition = (currentPosition * 0.77) - 37;
    var needle = $('needleIMG');
    if (needle) {
      needle.style.transform = 'rotate(' + adjustedPosition + 'deg)';
    }

    // lights, same thresholds as the original
    if (actualPosition <= 10) {
      setOpacity('mask-highlight', 0);
      setOpacity('light1', 0);
      setOpacity('light2', 0);
      setOpacity('light3', 0);
    }
    if (actualPosition > 15 && actualPosition <= 30) {
      setOpacity('mask-highlight', 0.3);
      setOpacity('light1', 1);
      setOpacity('light2', 0);
      setOpacity('light3', 0);
    }
    if (actualPosition > 40 && actualPosition <= 50) {
      setOpacity('mask-highlight', 0.7);
      setOpacity('light1', 1);
      setOpacity('light2', 1);
      setOpacity('light3', 0);
    }
    if (actualPosition > 70) {
      setOpacity('mask-highlight', 1);
      setOpacity('light1', 1);
      setOpacity('light2', 1);
      setOpacity('light3', 1);
    }
  }
  window.needleMoved = needleMoved;

  function needleToZero() {
    var needle = $('needleIMG');
    if (needle) { needle.style.transform = 'rotate(-37deg)'; }
  }
  window.needleToZero = needleToZero;

  // --- counters ----------------------------------------------------------

  function setDigit(id, digit) {
    var el = $(id);
    if (el) { el.className = 'img' + digit; }
  }

  function updateCounters(ghostsFound, ghostsGenerated) {
    ghostsFound = parseInt(ghostsFound, 10) || 0;
    ghostsGenerated = parseInt(ghostsGenerated, 10) || 0;
    var ghostsEscaped = ghostsGenerated - ghostsFound;

    // the mechanical counter only has three wheels
    var shown = Math.min(Math.max(ghostsFound, 0), 999);
    var str = String(shown);
    while (str.length < 3) { str = '0' + str; }
    setDigit('hundreds', shown >= 100 ? str.charAt(0) : '00');
    setDigit('tens', shown >= 10 ? str.charAt(1) : '00');
    setDigit('ones', str.charAt(2));

    setText('.ghostsdetected', ghostsGenerated);
    setText('.ghostsescaped', ghostsEscaped);
    setText('.ghostsfound', ghostsFound);
  }
  window.updateCounters = updateCounters;

  function setText(selector, value) {
    var els = document.querySelectorAll(selector);
    for (var i = 0; i < els.length; i++) { els[i].textContent = value; }
  }

  function loadGhostCount(ghostsGenerated, ghostsFound /*, needlePosition */) {
    updateCounters(ghostsFound, ghostsGenerated);
  }
  window.loadGhostCount = loadGhostCount;

  function updatePanel() {
    var gen = typeof getLifeGhostsGenerated === 'function' ? getLifeGhostsGenerated() : 0;
    var found = typeof getLifeGhostsFound === 'function' ? getLifeGhostsFound() : 0;
    setText('.ghostsdetected', gen);
    setText('.ghostsescaped', gen - found);
    setText('.ghostsfound', found);
  }
  window.updatePanel = updatePanel;

  // --- hooks called by ghost.js -----------------------------------------

  // a ghost has been found
  function ghostFound(numberOfGhostsDetected, lifetimeGhostsDetected, lifetimeghostgenerated) {
    updateCounters(lifetimeGhostsDetected, lifetimeghostgenerated);
    playAudio();
  }
  window.ghostFound = ghostFound;

  // a ghost disappears (found or not)
  function ghostDisappeared(/* ghostWasFound, lastNeedlePosition */) {
    stopAudio2();
    playAudio3();
    needleMoved(0, 0);
  }
  window.ghostDisappeared = ghostDisappeared;

  // a ghost appears
  function ghostAppeard(/* numberOfGhostsGenerated */) {
    playAudio2();
  }
  window.ghostAppeard = ghostAppeard;

  // --- boot --------------------------------------------------------------

  needleToZero();
  showPanel('home');
})();
