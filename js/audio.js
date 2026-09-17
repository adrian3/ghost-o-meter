// Audio player
//
// Ported from the Cordova Media plugin to plain HTML5 Audio.
//
// ghostFoundAudio        = WarningBeep.mp3
// backgroundAudio        = static.mp3
// ghostDissappearedAudio = WalkieTalkieInterference03.mp3
//
// Mobile browsers refuse to play sound until the user has interacted with the
// page, so unlockAudio() is called from the first tap (see sensors.js). It
// plays and immediately pauses every clip, which is enough to "warm up" the
// elements so later play() calls succeed without a gesture.

var ghostFoundAudio = makeAudio('audio/WarningBeep.mp3');
var backgroundAudio = makeAudio('audio/static.mp3');
var ghostDissappearedAudio = makeAudio('audio/WalkieTalkieInterference03.mp3');

var audioUnlocked = false;

function makeAudio(src) {
  var a = new Audio(src);
  a.preload = 'auto';
  a.addEventListener('error', function () {
    console.log('Audio error loading ' + src);
  });
  return a;
}

function safePlay(a) {
  if (!a) { return; }
  try {
    a.currentTime = 0;
  } catch (e) { /* not loaded yet, fine */ }
  var p = a.play();
  if (p && typeof p.catch === 'function') {
    p.catch(function (err) {
      // Usually NotAllowedError before the first user gesture. Harmless.
      console.log('Audio play blocked: ' + err.name);
    });
  }
}

function safeStop(a) {
  if (!a) { return; }
  a.pause();
  try { a.currentTime = 0; } catch (e) { /* ignore */ }
}

// Called from the first user gesture. Returns a promise that resolves once
// every clip has been touched.
function unlockAudio() {
  if (audioUnlocked) { return Promise.resolve(); }
  audioUnlocked = true;
  var clips = [ghostFoundAudio, backgroundAudio, ghostDissappearedAudio];
  return Promise.all(clips.map(function (a) {
    var wasMuted = a.muted;
    a.muted = true;
    var p = a.play();
    if (!p || typeof p.then !== 'function') { p = Promise.resolve(); }
    return p.then(function () {
      a.pause();
      try { a.currentTime = 0; } catch (e) { /* ignore */ }
      a.muted = wasMuted;
    }).catch(function () {
      a.muted = wasMuted;
    });
  }));
}

// --- Same call names as the original app -------------------------------

// Audio 1: ghost found beep
function playAudio()  { safePlay(ghostFoundAudio); }
function pauseAudio() { if (ghostFoundAudio) { ghostFoundAudio.pause(); } }
function stopAudio()  { safeStop(ghostFoundAudio); }

// Audio 2: background static while a ghost is present
function playAudio2()  { safePlay(backgroundAudio); }
function pauseAudio2() { if (backgroundAudio) { backgroundAudio.pause(); } }
function stopAudio2()  { safeStop(backgroundAudio); }

// Audio 3: walkie-talkie interference when a ghost disappears
function playAudio3()  { safePlay(ghostDissappearedAudio); }
function pauseAudio3() { if (ghostDissappearedAudio) { ghostDissappearedAudio.pause(); } }
function stopAudio3()  { safeStop(ghostDissappearedAudio); }
