// Ghost-O-Meter sensors
//
// Replaces the Cordova accelerometer + compass plugins with the browser's
// DeviceOrientation API and feeds ghost.js through setHeading() / setPitch().
//
//   heading  iOS Safari: event.webkitCompassHeading (magnetic, 0-359)
//            Android:    'deviceorientationabsolute' alpha, converted to a
//                        compass heading (360 - alpha)
//   pitch    event.beta, negated so 0 = flat on its back, -90 = upright,
//            matching what the old accelerometer maths produced.
//
// iOS 13+ only grants orientation access from inside a user gesture, and every
// mobile browser blocks audio until the first tap. So the game starts as soon
// as the page loads, sensors start immediately wherever the browser allows it,
// and the first tap on the gauge does the rest (permission prompt + audio
// unlock). A "Tap to power on" hint shows until that tap happens.
//
// With no motion sensors at all (a desktop browser) the meter falls back to
// the mouse/touch position: left-right = heading, up-down = pitch. That keeps
// the app playable, and testable, on a laptop.

(function () {
  'use strict';

  var sensorsActive = false;
  var listening = false;
  var gotOrientationEvent = false;
  var usingAbsolute = false;
  var pointerFallback = false;
  var unlocked = false;
  var needsGesture = false;
  var permissionGranted = false;

  var statusEl = document.getElementById('sensor-status');
  var hintEl = document.getElementById('poweron');

  function setStatus(msg) {
    if (statusEl) { statusEl.textContent = msg; }
  }

  function clampPitch(p) {
    if (p > 90) { p = 90; }
    if (p < -90) { p = -90; }
    return p;
  }

  // --- orientation events ------------------------------------------------

  function onOrientation(ev) {
    if (ev.beta === null && ev.alpha === null) { return; }
    gotOrientationEvent = true;

    var heading = null;
    if (typeof ev.webkitCompassHeading === 'number' && !isNaN(ev.webkitCompassHeading)) {
      heading = ev.webkitCompassHeading;
    } else if (ev.absolute === true || ev.type === 'deviceorientationabsolute') {
      if (typeof ev.alpha === 'number') { heading = (360 - ev.alpha) % 360; }
    } else if (!usingAbsolute && typeof ev.alpha === 'number') {
      // relative alpha: not a true compass, but still lets the game run
      heading = (360 - ev.alpha) % 360;
    }

    if (typeof ev.beta === 'number') {
      setPitch(clampPitch(-ev.beta));
    }
    if (heading !== null) {
      setHeading(Math.round(heading * 100) / 100);
    }
  }

  function onAbsoluteOrientation(ev) {
    usingAbsolute = true;
    onOrientation(ev);
  }

  function addListeners() {
    if (listening) { return; }
    listening = true;
    if ('ondeviceorientationabsolute' in window) {
      window.addEventListener('deviceorientationabsolute', onAbsoluteOrientation, true);
    }
    window.addEventListener('deviceorientation', onOrientation, true);
  }

  function removeListeners() {
    if (!listening) { return; }
    listening = false;
    window.removeEventListener('deviceorientationabsolute', onAbsoluteOrientation, true);
    window.removeEventListener('deviceorientation', onOrientation, true);
  }

  // --- pointer fallback (desktop) ---------------------------------------

  function onPointer(ev) {
    var x = ev.clientX / Math.max(window.innerWidth, 1);
    var y = ev.clientY / Math.max(window.innerHeight, 1);
    setHeading(Math.round(x * 359));
    setPitch(clampPitch(-(y * 90)));
  }

  function enablePointerFallback() {
    if (pointerFallback) { return; }
    pointerFallback = true;
    window.addEventListener('pointermove', onPointer);
    window.addEventListener('pointerdown', onPointer);
    setStatus('No motion sensors found: move the mouse (left/right = direction, up/down = height) to hunt.');
    if (hintEl && unlocked) { hintEl.hidden = true; }
  }

  // --- permission handling -------------------------------------------------

  function requestOrientationPermission() {
    var DOE = window.DeviceOrientationEvent;
    if (DOE && typeof DOE.requestPermission === 'function') {
      return DOE.requestPermission().then(function (state) {
        return state === 'granted';
      });
    }
    return Promise.resolve(true);
  }

  // Try to start straight away (works on Android and older iOS). If the
  // browser refuses because no gesture has happened yet, wait for the tap.
  function tryAutoStart() {
    if (!window.DeviceOrientationEvent) {
      enablePointerFallback();
      return;
    }
    requestOrientationPermission().then(function (granted) {
      if (granted) {
        permissionGranted = true;
        addListeners();
        watchForSilence();
      } else {
        needsGesture = true;
        setStatus('Motion access was denied. Reload and allow motion & orientation access to use the meter.');
      }
    }).catch(function () {
      // NotAllowedError: must be called from a user gesture (iOS 13+)
      needsGesture = true;
      showHint();
    });
  }

  // If no orientation event arrives for a while we are probably on a desktop.
  var silenceTimer = null;
  function watchForSilence() {
    clearTimeout(silenceTimer);
    silenceTimer = setTimeout(function () {
      if (!gotOrientationEvent) { enablePointerFallback(); }
    }, 3000);
  }

  function showHint() {
    if (hintEl) { hintEl.hidden = false; }
  }
  function hideHint() {
    if (hintEl) { hintEl.hidden = true; }
  }

  // --- first tap ----------------------------------------------------------

  function onFirstTap() {
    if (unlocked) { return; }
    unlocked = true;
    document.removeEventListener('click', onFirstTap, true);
    document.removeEventListener('touchend', onFirstTap, true);

    if (typeof unlockAudio === 'function') {
      unlockAudio().then(function () {
        // the first ghost appeared before sound was allowed: start its static now
        if (typeof ghostExists !== 'undefined' && ghostExists && typeof playAudio2 === 'function') {
          playAudio2();
        }
      });
    }

    if (needsGesture) {
      requestOrientationPermission().then(function (granted) {
        if (granted) {
          permissionGranted = true;
          needsGesture = false;
          if (sensorsActive) { addListeners(); }
          watchForSilence();
        } else {
          setStatus('Motion access was denied. Reload and allow motion & orientation access to use the meter.');
        }
      }).catch(function (err) {
        console.log('Orientation permission error: ' + err);
        setStatus('Could not get motion access: ' + err);
      });
    }
    hideHint();
  }

  // --- API used by ghost.js -----------------------------------------------

  window.startSensors = function () {
    sensorsActive = true;
    if (pointerFallback || listening) { return; }
    if (permissionGranted) {
      addListeners();
      return;
    }
    if (!needsGesture) {
      tryAutoStart();
    }
  };

  window.stopSensors = function () {
    sensorsActive = false;
    removeListeners();
    clearTimeout(silenceTimer);
  };

  // --- boot -----------------------------------------------------------------

  // Show the hint straight away; on platforms where no gesture is needed it
  // still reminds people that the first tap turns the sound on.
  showHint();
  document.addEventListener('click', onFirstTap, true);
  document.addEventListener('touchend', onFirstTap, true);

  if (typeof startGame === 'function') { startGame(); }
})();
