// Edited by Adrian, February 2013

	var ghostcancelid = null; //timeout for finding a ghost
	var clearghostlastid = null //timeout once the ghost has been found, how long it will last
	var newghosttimer = null //timeout to generate a new ghost
	var needleupdateid = null;
	
	var accelwatchid = null; //watcher for accel
	var compasswatchid = null; //watcher for compass
	
	var ghostfindaccumlator = 0; //accumulates the number of milliseconds a ghost has been found
	var ghostsfound = 0; //number of ghosts found this app run
	var ghostsgenerated = 0; //number of ghosts generated this app run
	var lifeghostsfound = 0;
	var lifeghostsgenerated = 0;
	var ghostlasttime = 0; //timestamp of when the last time a ghost meter was at or above detection threshold

	var currentHeading = 0;
	
	var ghostHasBeenFound = false;
	var ghostExists = false;
	var ghostHeading = 0;
	var ghostAngle = 0;
	
	var pitcharray = new Array();
	//var rollarray = new Array();
	
	var pitchaverage = 0;
	//var rollaverage = 0;
	
	var needlePos = 0;
	
	document.addEventListener("deviceready", onDeviceReady, false);


	function pauseEvent(){
		stopwatches();
		
		//stop timeouts
		clearTimeout(ghostcancelid);
		clearTimeout(newghosttimer);
		
	}
	
	function resumeEvent(){
		startwatches();
		
		//generate new Ghost in 150 ms to avoid crasing app
		setTimeout(generateNewGhost,150);
		
	}
	
	function startwatches(){
		//get acceleramitor data as fast as we can (40 ms is the quickest)
		accelwatchid = navigator.accelerometer.watchAcceleration(accelerometerSuccess, accelerometerError, {frequency: 150});

		//get compus data fairly often so we can update quickly for wide swings
		compasswatchid = navigator.compass.watchHeading(compassSuccess, compassError, {frequency: 200});
		
		//setup repeating function call to update the gui needle
		needleupdateid = setInterval(sendNeedleUpdate,150);
		
	}
	
	function stopwatches(){
		navigator.accelerometer.clearWatch(accelwatchid);
		navigator.compass.clearWatch(compasswatchid);
		
		//clearInterval(accelwatchid);
		//clearInterval(compasswatchid);
		clearInterval(needleupdateid);
	}

    // PhoneGap is ready
    //
    function onDeviceReady() {

		document.addEventListener("pause", pauseEvent, false);
		document.addEventListener("resume", resumeEvent, false);
		
		startwatches();

		//read the life varaibles from local storage;
		var temp = localStorage.getItem("lifeghostsfound");
		if(temp != null){
			lifeghostsfound = parseInt(temp,10);
		}
		
		temp = localStorage.getItem("lifeghostsgenerated");
		if(temp != null){
			lifeghostsgenerated = parseInt(temp,10);
		}

		//create the first ghost 
		setTimeout(generateNewGhost,200);

		loadGhostCount(lifeghostsgenerated,lifeghostsfound,needlePos);

	}
	
	function getLifeGhostsFound(){
	
		var temp = localStorage.getItem("lifeghostsfound");
		if(temp != null){
			return parseInt(temp,10);
		}
	
		return 	0;
	}
	
	function getLifeGhostsGenerated(){
	
		var temp = localStorage.getItem("lifeghostsgenerated");
		if(temp != null){
			return parseInt(temp,10);
		}
	
		return 	0;
	}
	
	
	function accelerometerSuccess(acceleration){
		//round to 2 digits
		var x = (Math.round((acceleration.x/9.81) * 100) / 100) * -1;
		var y = (Math.round((acceleration.y/9.81) * 100) / 100) * -1;
		var z = (Math.round((acceleration.z/9.81) * 100) / 100) * -1;

		
		//do bounds
		if(y > 1) y=1;
		else if(y < -1) y=-1;
		
		if(z > 1) z=1;
		else if(z < -1) z=-1;
		
		if(x > 1) x=1;
		else if(x < -1) x=-1;
		
		var currentpitch = Math.asin(y) * (180/3.14);
		var rawpitch = currentpitch;

		//do accelerametor data here
		pitcharray.push(currentpitch);
		if(pitcharray.length > 3){
			pitcharray.splice(0,1);
		}
		
		var theaverage = 0;
		for(var i=0;i<pitcharray.length;i++){
			theaverage += pitcharray[i];
		}
		pitchaverage = Math.round(((theaverage/(pitcharray.length)) * 100))/100;
			
		//update the needle
		updateNeedle();
		
		//debug
		document.getElementById("currentx").innerHTML = x;
		document.getElementById("currenty").innerHTML = y;
		document.getElementById("currentz").innerHTML = z;
		
		document.getElementById("averagepitch").innerHTML = pitchaverage;
		//document.getElementById("averageroll").innerHTML = rollaverage;

	}
	
	function accelerometerError(err){
		console.log("Accelerometer Error: " + err);
	}
	
	function compassSuccess(heading){
		
		if(typeof heading === "object"){
			currentHeading = heading.magneticHeading;
			console.log("Heading: " + heading.magneticHeading);	
		}
		else{
			currentHeading = heading;
			
			console.log("Heading: " + heading);			
		}

		
		//update the needle
		updateNeedle();

		
		//debugging
		document.getElementById("compassheading").innerHTML = currentHeading;

	}
	
	function compassError(err){
		console.log("Compass Error: " + err);
	}
	
	
	function generateNewGhost(){
		ghostHeading = Math.floor(Math.random()*350) + 5; //we want a +-5 degree tollerance
		
		//make sure the new heading is at least 90 degrees off from the current heading
		if(currentHeading > 90 && Math.abs(ghostHeading - currentHeading) < 90){
			ghostHeading = ghostHeading + 90;
			if(ghostHeading > 359){
				ghostHeading = ghostHeading -359;
			}
		}
		
		//-22 to -77 is the angle range
		ghostAngle = (Math.floor(Math.random()*55) + 22) * -1;
		
		//increase number of ghosts genereated
		ghostsgenerated++;
		lifeghostsgenerated++;
		
		//save it
		localStorage.setItem('lifeghostsgenerated',lifeghostsgenerated);
		
		//set that the ghost exists
		ghostExists = true;
		
		//set that the ghost hasn't been found
		ghostHasBeenFound = false;
		
		//clear the last ghost detection timestamp
		ghostlasttime = 0;
		
		//clear out accumulator
		ghostfindaccumlator = 0;
		
		//clear the timeout to make the found ghost disapear
		clearTimeout(clearghostlastid);
		
		//if ghost hasn't been found in 3 min, generate a new one.
		ghostcancelid = setTimeout(clearGhost,165000);
		
		//update the GUI with the number of ghosts we have generated
		ghostAppeard(ghostsgenerated, lifeghostsgenerated);

		
		//debugging
		document.getElementById("ghostheading").innerHTML = ghostHeading;
		document.getElementById("ghostpitch").innerHTML = ghostAngle;

	}
	
	
	function updateNeedle(){
		var headingdiff = 0;
		var anglediff = 0;
		
		var headingpoints = 0;
		var anglepoints = 0;
		
		var anglepercent = 0;

		//check if our bearing is within the beginning stages, if our heading is 30+-		
		if(currentHeading < 30 && ghostHeading >= 330){
			headingdiff = Math.abs((currentHeading + 360) - ghostHeading);
		}
		else if(currentHeading > 330 && ghostHeading < 30){
			headingdiff = Math.abs(currentHeading - (ghostHeading + 360));
		}
		else{
			headingdiff = Math.abs(currentHeading - ghostHeading);
		}
		
		
		var algheadingdiff = headingdiff;
		
		if(algheadingdiff-15 <= 1){
			algheadingdiff = 15; 
		}
		algheadingpoints = Math.round(60 * (15/(algheadingdiff)));
		
		
		//direction gets you 80 of 100, and a fraction of the height
		if(headingdiff <=15){
			headingpoints = 60;
			anglepercent = 1;
		}
		else if(headingdiff <=20){
			headingpoints = 45;
			anglepercent = .60;
		}
		else if(headingdiff <=25){
			headingpoints = 36;
			anglepercent = .40;
		}
		else if(headingdiff <=30){
			headingpoints = 60;
			anglepercent = .25;
		}
		else if(headingdiff <=90){
			headingpoints = 15;
			anglepercent = .10;
		}
		else{
			anglepercent = 0;
		}
		
		
		if(algheadingpoints > headingpoints){
			headingpoints = algheadingpoints;
		}
		
		if(headingpoints >60){
			headingpoints = 60;
		}

		//check our height and see if its close (30 degrees min)
		anglediff = Math.abs(pitchaverage - ghostAngle);
		
		
		//check height worht 20% * whatever accuracy they get from the heading
		if(anglediff <=10){
			anglepoints = (40 * anglepercent);
		}
		else if(anglediff <=15){
			anglepoints = (35* anglepercent);
		}
		else if(anglediff <=20){
			anglepoints = (30 * anglepercent);
		}
		else if(anglediff <=25){
			anglepoints = (25 * anglepercent);
		}
		else if(anglediff <=30){
			anglepoints = (15 * anglepercent);
		}
		else if(anglediff <=50){
			anglepoints = (8 * anglepercent);
		}

		needlePos = headingpoints + anglepoints;
		
		
		//see if we are at our threshold for a "detection" if so, accumulate the time
		if(needlePos >= 70){
			if(ghostlasttime > 0){
				ghostfindaccumlator = ghostfindaccumlator + (Date.now() - ghostlasttime);
			}
			ghostlasttime = Date.now();
			
		}
		else{
			ghostlasttime = 0;
		}

		//update the gui with the needle position
		if(ghostExists){
			//needleMoved(needlePos);

			//check if it is at our 5 seconds ghost detection threshold, and we haven't found the ghost
			if(ghostfindaccumlator >= 5000 && ghostHasBeenFound == false){
				//set that the ghost has been found
				ghostHasBeenFound = true;
				
				//increment the ghosts found
				ghostsfound++;
				lifeghostsfound++;
				localStorage.setItem('lifeghostsfound',lifeghostsfound);
				
				//set the clear ghost timeout, so we get rid of it in about 1 min
				clearghostlastid = setTimeout(clearGhost, 60000);
				
				//clear the timeout for the ghost to be canceled
				clearTimeout(ghostcancelid);
				
				//update the GUI with number of ghosts found
				ghostFound(ghostsfound, lifeghostsfound, lifeghostsgenerated);
				
			}
		}
		
		//debug
		document.getElementById("needle").innerHTML = needlePos;
		document.getElementById("headingpoints").innerHTML = headingpoints;
		document.getElementById("anglepoints").innerHTML = anglepoints;
		
		document.getElementById("headingdiff").innerHTML = headingdiff;
		document.getElementById("anglediff").innerHTML = anglediff;
		
		document.getElementById("detections").innerHTML = ghostfindaccumlator;
		document.getElementById("ghostexhists").innerHTML = ghostHasBeenFound;
	
		
	}
	
	function sendNeedleUpdate(){
		if(ghostExists){
			var myrandomness = Math.floor(Math.random()*20) -10; 
			/*
			var bigjump = Math.floor(Math.random()*100);
			if(bigjump >=90){
				myrandomness * 3;
			}
			*/
			
			needleMoved(needlePos + myrandomness, needlePos);
		}
	}
	
	function clearGhost(){
		//turn off ghosts for a short period
		ghostExists = false;
		
		//generate a new ghost in 15 seconds
		newghosttimer = setTimeout(generateNewGhost,15000);
		
		//update the GUI that the ghost has "disappeared", pass in if the ghost was found, and the last needle position
		ghostDisappeared(ghostHasBeenFound, needlePos);
	}
	
/*

			TESTING CODE
			
		

	function sendacceldata(){
		var myobject = {x:0, y:0, z:0};
		myobject.x = document.getElementById("x").value;
		myobject.y = document.getElementById("y").value;
		myobject.z = document.getElementById("z").value;
		
		accelerometerSuccess(myobject);	
	}
	
	function sendcompassdata(){
		compassSuccess(document.getElementById("heading").value);
	}

	setInterval(sendacceldata,50);
	setInterval(sendcompassdata,250);
	setTimeout(onDeviceReady,250);
	needleupdateid = setInterval(sendNeedleUpdate,150);
*/	