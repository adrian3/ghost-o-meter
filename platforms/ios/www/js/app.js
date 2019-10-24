		//function gets called when the needle position has been recalculated
		//this function only gets called when there is a ghost to be found
		//currentPosition is an integer with the current position of the needle 0-100
		function needleMoved(currentPosition,actualPosition){

      if (actualPosition>50) {
       button2 = document.getElementById("homeb2");
       if (button2.style.opacity!=1) {
         button2.style.opacity = 1;
         button2.style.webkitTransition = 'opacity 1000ms linear';
       }
     }
     else {
      button2 = document.getElementById("homeb2");
      if (button2.style.opacity!=0) {
        button2.style.opacity = 0;
        button2.style.webkitTransition = 'opacity 1000ms linear';
      }	
    }

    if (actualPosition>70) {
      navigator.notification.vibrate(2000);
    }
    else {
    }

    adjustedPosition = (currentPosition*0.77)-37;
      // if (adjustedPosition>40) {
      //   adjustedPosition=40;
      // }
      // if (adjustedPosition<-37) {
      //   adjustedPosition=-37;
      // }
      needle = document.getElementById("needleIMG");
      needle.style.webkitTransitionDuration = '500ms';
      needle.style.webkitTransform = "rotate(" + adjustedPosition + "deg)";

      if (actualPosition<=10) { 
        light0 = document.getElementById("mask-highlight");
        if (light0.style.opacity!=0) {
          light0.style.opacity = 0;
          light0.style.webkitTransition = 'opacity 500ms linear';
        }
        light1 = document.getElementById("light1");
        if (light1.style.opacity!=0) {
          light1.style.opacity = 0;
          light1.style.webkitTransition = 'opacity 500ms linear';
        }          
        light2 = document.getElementById("light2");
        if (light2.style.opacity!=0) {
          light2.style.opacity = 0;
          light2.style.webkitTransition = 'opacity 500ms linear';
        }
        light3 = document.getElementById("light3");
        if (light3.style.opacity!=0) {
          light3.style.opacity = 0;
          light3.style.webkitTransition = 'opacity 500ms linear';          
        }
      }
      if (actualPosition>15&&actualPosition<=30) { 
        light0 = document.getElementById("mask-highlight");
        if (light0.style.opacity!=0.3) {
          light0.style.opacity = 0.3;
          light0.style.webkitTransition = 'opacity 500ms linear';
        }
        light1 = document.getElementById("light1");
        if (light1.style.opacity!=1) {
          light1.style.opacity = 1;
          light1.style.webkitTransition = 'opacity 500ms linear';
        }          
        light2 = document.getElementById("light2");
        if (light2.style.opacity!=0) {
          light2.style.opacity = 0;
          light2.style.webkitTransition = 'opacity 500ms linear';
        }
        light3 = document.getElementById("light3");
        if (light3.style.opacity!=0) {
          light3.style.opacity = 0;
          light3.style.webkitTransition = 'opacity 500ms linear';   
        }
      }
      if (actualPosition>40&&actualPosition<=50) { 
        light0 = document.getElementById("mask-highlight");
        if (light0.style.opacity!=0.7) {
          light0.style.opacity = 0.7;
          light0.style.webkitTransition = 'opacity 500ms linear';
        }
        light1 = document.getElementById("light1");
        if (light1.style.opacity!=1) {
          light1.style.opacity = 1;
          light1.style.webkitTransition = 'opacity 500ms linear';
        }          
        light2 = document.getElementById("light2");
        if (light2.style.opacity!=1) {
          light2.style.opacity = 1;
          light2.style.webkitTransition = 'opacity 500ms linear';
        }
        light3 = document.getElementById("light3");
        if (light3.style.opacity!=0) {
          light3.style.opacity = 0;
          light3.style.webkitTransition = 'opacity 500ms linear';   
        }
      }
      if (actualPosition>70) { 
        light0 = document.getElementById("mask-highlight");
        if (light0.style.opacity!=1) {
          light0.style.opacity = 1;
          light0.style.webkitTransition = 'opacity 500ms linear';
        }
        light1 = document.getElementById("light1");
        if (light1.style.opacity!=1) {
          light1.style.opacity = 1;
          light1.style.webkitTransition = 'opacity 500ms linear';
        }          
        light2 = document.getElementById("light2");
        if (light2.style.opacity!=1) {
          light2.style.opacity = 1;
          light2.style.webkitTransition = 'opacity 500ms linear';
        }
        light3 = document.getElementById("light3");
        if (light3.style.opacity!=1) {
          light3.style.opacity = 1;
          light3.style.webkitTransition = 'opacity 500ms linear';   
        }
      }
    }

// Normally phonegap aps use a function called onBodyLoad, but in this case I call needleToZero
function needleToZero() {
      // when the app loads, push the needle to zero
      needle = document.getElementById("needleIMG");
      needle.style.webkitTransitionDuration = '500ms';
      needle.style.webkitTransform = "rotate(-37deg)";

    }

var app = {
  initialize: function() {
    this.bindEvents();
  },
  bindEvents: function() {
    document.addEventListener('deviceready', this.onDeviceReady, false);
  },

// Device ready actions
onDeviceReady: function() {
  app.receivedEvent('deviceready');
},
receivedEvent: function(id) {
    // put things that will happen when app is loaded here.
  }
};

app.initialize();

function alertDismissed() {
    // do nothing
  }

  function updateCounters(ghostsFound,ghostsGenerated) {
    if (ghostsGenerated==null) {
      ghostsGenerated=0;
    }
    ghostsEscaped=(ghostsGenerated-ghostsFound);
// alert(ghostsFound);
str='"'+ghostsFound+'"';
// for one digit numbers
if (ghostsFound<=9) {
  $('#hundreds').removeClass().addClass('img00');
  $('#tens').removeClass().addClass('img00');
  $('#ones').removeClass().addClass('img'+ghostsFound);
}
// for two digit numbers
if (ghostsFound>=10&&ghostsFound<=99) {
  ones=str.substr(2,1);
  tens=str.substr(1,1);
  $('#hundreds').removeClass().addClass('img00');
  $('#tens').removeClass().addClass('img'+tens);
  $('#ones').removeClass().addClass('img'+ones);
}
// for three digit numbers
if (ghostsFound>=100) {
  ones=str.substr(3,1);
  tens=str.substr(2,1);
  hundreds=str.substr(1,1);
  $('#hundreds').removeClass().addClass('img'+hundreds);
  $('#tens').removeClass().addClass('img'+tens);
  $('#ones').removeClass().addClass('img'+ones);
}


$('.ghostsdetected').html(''+ghostsGenerated+'');
$('.ghostsescaped').html(''+ghostsEscaped+'');
$('.ghostsfound').html(''+ghostsFound+'');


}

		//function gets called when a ghost has been found
		//numberOfGhostsDetected is an integer with the number of ghosts detected for this app run 
		function ghostFound(numberOfGhostsDetected,lifetimeGhostsDetected,lifetimeghostgenerated){
      updateCounters(lifetimeGhostsDetected,lifetimeghostgenerated);

      playAudio('audio/WarningBeep.wav');

			//do code to increase the ghost counter here...
      // alert("Ghost has been found by user: " + numberOfGhostsDetected);

    }
    
		//function gets called when a ghost disapeers (gets called for both found and unfound ghosts)
		//ghostWasFound is a boolean that tells if the ghost was found or not
		//lastNeedlePosition is an integer with the current position of the needle 0-100 
		function ghostDisappeared(ghostWasFound, lastNeedlePosition){
			//do code to anything fancy while we wait the 15 seconds for the ghost to disapear
      // alert("Ghost has disappeared, ghostWasFound: " + ghostWasFound + ", lastNeedlePosition: " + lastNeedlePosition);
      stopAudio2('audio/static.wav');
      playAudio3('audio/WalkieTalkieInterference03.wav');

      needleMoved(0,0);

    }
		//function gets called when a ghost appears
		//numberOfGhosts is an integer with the number of ghosts generated for this app run 
		function ghostAppeard(numberOfGhostsGenerated){
			//do code to anything fancy for the ghost appearing
      // alert("Ghost has appeared: " + numberOfGhostsGenerated);
      playAudio2('audio/static.wav');

    }

// This prevents the app from scrolling on an element. To use apply ontouchmove="BlockMove(event);" to the div you don't want to scroll
function BlockMove(event) { event.preventDefault(); } 

function loadGhostCount(ghostsGenerated,ghostsFound,needlePosition) {
  updateCounters(ghostsFound,ghostsGenerated);
}

function updatePanel() {
  ghostsEscaped=(getLifeGhostsGenerated()-getLifeGhostsFound());
  $('.ghostsdetected').html(getLifeGhostsGenerated());
  $('.ghostsescaped').html(ghostsEscaped);
  $('.ghostsfound').html(getLifeGhostsFound());
}
