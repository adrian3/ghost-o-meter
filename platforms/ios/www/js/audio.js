// Audio player
//

// Audio = ghostFoundAudio - WarningBeep.wav
// Audio2 = backgroundAudio - static.wav
// Audio3 = ghostDissappearedAudio - WalkieTalkieInterference03.wav

var ghostFoundAudio = null;
var backgroundAudio = null;
var ghostDissappearedAudio = null;

// Play audio 1
//
function playAudio(src) {
	// Create Media object from src
	ghostFoundAudio = new Media(src, onAudioSuccess, onAudioError);

	// Play audio
	ghostFoundAudio.play();
}

// Pause audio
// 
function pauseAudio() {
	if (ghostFoundAudio) {
		ghostFoundAudio.pause();
	}
}

// Stop audio
// 
function stopAudio() {
	if (ghostFoundAudio) {
		ghostFoundAudio.stop();
	}
}


// Play audio 2
function playAudio2(src) {
	backgroundAudio = new Media(src, onAudioSuccess, onAudioError);
	backgroundAudio.play();
}
function pauseAudio2() {
	if (backgroundAudio) {
		backgroundAudio.pause();
	}
}
function stopAudio2() {
	if (backgroundAudio) {
		backgroundAudio.stop();
	}
}
	// Play audio 3
function playAudio3(src) {
	ghostDissappearedAudio = new Media(src, onAudioSuccess, onAudioError);
	ghostDissappearedAudio.play();
}
function pauseAudio3() {
	if (ghostDissappearedAudio) {
		ghostDissappearedAudio.pause();
	}
}
function stopAudio3() {
	if (ghostDissappearedAudio) {
		ghostDissappearedAudio.stop();
	}
}



// onError Callback 
//
function onAudioSuccess() {
	console.log("Sound started");
}

// onError Callback 
//
function onAudioError(error) {
	alert('code: '    + error.code    + '\n' + 
		  'message: ' + error.message + '\n');
}