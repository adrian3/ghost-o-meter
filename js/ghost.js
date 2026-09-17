// Ghost-O-Meter game logic
//
// Originally written for PhoneGap/Cordova, edited by Adrian, February 2013.
// Ported to the open web: the accelerometer and compass plugins are replaced
// by sensors.js, which feeds this file via setHeading() and setPitch().
// The scoring maths, thresholds and timers are unchanged.

var ghostcancelid = null;    // timeout for finding a ghost
var clearghostlastid = null; // timeout once the ghost has been found, how long it will last
var newghosttimer = null;    // timeout to generate a new ghost
var needleupdateid = null;

var ghostfindaccumlator = 0; // accumulates the number of milliseconds a ghost has been found
var ghostsfound = 0;         // number of ghosts found this app run
var ghostsgenerated = 0;     // number of ghosts generated this app run
var lifeghostsfound = 0;
var lifeghostsgenerated = 0;
var ghostlasttime = 0;       // timestamp of when the last time a ghost meter was at or above detection threshold

var currentHeading = 0;

var ghostHasBeenFound = false;
var ghostExists = false;
var ghostHeading = 0;
var ghostAngle = 0;

var pitcharray = [];
var pitchaverage = 0;

var needlePos = 0;

var gameRunning = false;

// --- persistence -----------------------------------------------------------

function readInt(key) {
  try {
    var temp = localStorage.getItem(key);
    if (temp !== null) {
      var n = parseInt(temp, 10);
      if (!isNaN(n)) { return n; }
    }
  } catch (e) { /* localStorage unavailable (private mode etc.) */ }
  return 0;
}

function writeInt(key, value) {
  try { localStorage.setItem(key, value); } catch (e) { /* ignore */ }
}

function getLifeGhostsFound() { return readInt('lifeghostsfound'); }
function getLifeGhostsGenerated() { return readInt('lifeghostsgenerated'); }

function resetLifetimeCounts() {
  lifeghostsfound = 0;
  lifeghostsgenerated = 0;
  ghostsfound = 0;
  ghostsgenerated = 0;
}

// --- lifecycle -------------------------------------------------------------

function pauseEvent() {
  stopwatches();
  clearTimeout(ghostcancelid);
  clearTimeout(newghosttimer);
}

function resumeEvent() {
  startwatches();
  // generate new Ghost in 150 ms to avoid crashing app
  setTimeout(generateNewGhost, 150);
}

function startwatches() {
  if (typeof startSensors === 'function') { startSensors(); }
  // repeating call to update the gui needle
  clearInterval(needleupdateid);
  needleupdateid = setInterval(sendNeedleUpdate, 150);
}

function stopwatches() {
  if (typeof stopSensors === 'function') { stopSensors(); }
  clearInterval(needleupdateid);
}

// Replaces Cordova's deviceready handler.
function startGame() {
  if (gameRunning) { return; }
  gameRunning = true;

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { pauseEvent(); } else { resumeEvent(); }
  });

  startwatches();

  // read the lifetime variables from local storage
  lifeghostsfound = getLifeGhostsFound();
  lifeghostsgenerated = getLifeGhostsGenerated();

  // create the first ghost
  setTimeout(generateNewGhost, 200);

  loadGhostCount(lifeghostsgenerated, lifeghostsfound, needlePos);
}

// --- sensor inputs (called by sensors.js) ----------------------------------

// pitch in degrees: 0 = phone flat on its back, -90 = phone upright
function setPitch(currentpitch) {
  pitcharray.push(currentpitch);
  if (pitcharray.length > 3) {
    pitcharray.splice(0, 1);
  }
  var theaverage = 0;
  for (var i = 0; i < pitcharray.length; i++) {
    theaverage += pitcharray[i];
  }
  pitchaverage = Math.round((theaverage / pitcharray.length) * 100) / 100;

  updateNeedle();
}

// compass heading in degrees, 0-359
function setHeading(heading) {
  currentHeading = heading;
  updateNeedle();
}

// --- ghosts ----------------------------------------------------------------

function generateNewGhost() {
  ghostHeading = Math.floor(Math.random() * 350) + 5; // we want a +-5 degree tolerance

  // make sure the new heading is at least 90 degrees off from the current heading
  if (currentHeading > 90 && Math.abs(ghostHeading - currentHeading) < 90) {
    ghostHeading = ghostHeading + 90;
    if (ghostHeading > 359) {
      ghostHeading = ghostHeading - 359;
    }
  }

  // -22 to -77 is the angle range
  ghostAngle = (Math.floor(Math.random() * 55) + 22) * -1;

  ghostsgenerated++;
  lifeghostsgenerated++;
  writeInt('lifeghostsgenerated', lifeghostsgenerated);

  ghostExists = true;
  ghostHasBeenFound = false;
  ghostlasttime = 0;
  ghostfindaccumlator = 0;

  clearTimeout(clearghostlastid);

  // if ghost hasn't been found in ~3 min, generate a new one.
  clearTimeout(ghostcancelid);
  ghostcancelid = setTimeout(clearGhost, 165000);

  ghostAppeard(ghostsgenerated, lifeghostsgenerated);
}

function updateNeedle() {
  var headingdiff = 0;
  var anglediff = 0;
  var headingpoints = 0;
  var anglepoints = 0;
  var anglepercent = 0;

  // handle the wrap-around at north
  if (currentHeading < 30 && ghostHeading >= 330) {
    headingdiff = Math.abs((currentHeading + 360) - ghostHeading);
  } else if (currentHeading > 330 && ghostHeading < 30) {
    headingdiff = Math.abs(currentHeading - (ghostHeading + 360));
  } else {
    headingdiff = Math.abs(currentHeading - ghostHeading);
  }

  var algheadingdiff = headingdiff;
  if (algheadingdiff - 15 <= 1) {
    algheadingdiff = 15;
  }
  var algheadingpoints = Math.round(60 * (15 / algheadingdiff));

  // direction gets you 60 of 100, and a fraction of the height
  if (headingdiff <= 15) {
    headingpoints = 60;
    anglepercent = 1;
  } else if (headingdiff <= 20) {
    headingpoints = 45;
    anglepercent = 0.60;
  } else if (headingdiff <= 25) {
    headingpoints = 36;
    anglepercent = 0.40;
  } else if (headingdiff <= 30) {
    headingpoints = 60;
    anglepercent = 0.25;
  } else if (headingdiff <= 90) {
    headingpoints = 15;
    anglepercent = 0.10;
  } else {
    anglepercent = 0;
  }

  if (algheadingpoints > headingpoints) {
    headingpoints = algheadingpoints;
  }
  if (headingpoints > 60) {
    headingpoints = 60;
  }

  // check our height and see if it's close
  anglediff = Math.abs(pitchaverage - ghostAngle);

  if (anglediff <= 10) {
    anglepoints = 40 * anglepercent;
  } else if (anglediff <= 15) {
    anglepoints = 35 * anglepercent;
  } else if (anglediff <= 20) {
    anglepoints = 30 * anglepercent;
  } else if (anglediff <= 25) {
    anglepoints = 25 * anglepercent;
  } else if (anglediff <= 30) {
    anglepoints = 15 * anglepercent;
  } else if (anglediff <= 50) {
    anglepoints = 8 * anglepercent;
  }

  needlePos = headingpoints + anglepoints;

  // at the detection threshold? accumulate the time
  if (needlePos >= 70) {
    if (ghostlasttime > 0) {
      ghostfindaccumlator = ghostfindaccumlator + (Date.now() - ghostlasttime);
    }
    ghostlasttime = Date.now();
  } else {
    ghostlasttime = 0;
  }

  if (ghostExists) {
    // 5 seconds on target and we haven't found the ghost yet
    if (ghostfindaccumlator >= 5000 && ghostHasBeenFound === false) {
      ghostHasBeenFound = true;

      ghostsfound++;
      lifeghostsfound++;
      writeInt('lifeghostsfound', lifeghostsfound);

      // the found ghost hangs around for about a minute
      clearghostlastid = setTimeout(clearGhost, 60000);

      // it can no longer escape
      clearTimeout(ghostcancelid);

      ghostFound(ghostsfound, lifeghostsfound, lifeghostsgenerated);
    }
  }
}

function sendNeedleUpdate() {
  if (ghostExists) {
    var myrandomness = Math.floor(Math.random() * 20) - 10;
    needleMoved(needlePos + myrandomness, needlePos);
  }
}

function clearGhost() {
  ghostExists = false;

  // generate a new ghost in 15 seconds
  clearTimeout(newghosttimer);
  newghosttimer = setTimeout(generateNewGhost, 15000);

  ghostDisappeared(ghostHasBeenFound, needlePos);
}

// Debug helper: current state of play, handy from the console.
function ghostDebug() {
  return {
    ghostExists: ghostExists,
    ghostHasBeenFound: ghostHasBeenFound,
    ghostHeading: ghostHeading,
    ghostAngle: ghostAngle,
    currentHeading: currentHeading,
    pitchaverage: pitchaverage,
    needlePos: needlePos,
    detectionMs: ghostfindaccumlator,
    ghostsfound: ghostsfound,
    ghostsgenerated: ghostsgenerated,
    lifeghostsfound: lifeghostsfound,
    lifeghostsgenerated: lifeghostsgenerated
  };
}
