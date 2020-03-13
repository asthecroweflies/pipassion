;(function(window, $) {
// Disclaimer: yes, I know. this code is painful to read.. 
// 	           but that's part of the fun!
//			   for this project only I rejoice (read: suffer) 
// 			   using such whimiscally poor code etiqutte.

var pi;
var max_score = 100000;
var knottyWords;
var gAcc = 9.80665;
var trainingMode = false;
var userQueried;
var playing = false;
var cur = 0; //current index in pi
var canvas = document.getElementById("gameCanvas");
var ctx = null;
var scoreTiers = [20, 100, 1000, 1000000];//for leatherboard pagination
var canvasWidth = canvas.width;
var canvasHeight = canvas.height;
var pieAmmo = [];
var cannonArmory = [];
var cannonInfo = [];
var currCannon = 0;
var pieAmt = 20;
var pieCount = 0;
var streak_count = 0;

var pieImage = new Image(16, 12);
pieImage.src = 'res/pie_mini.png';

var pieArrow = new Image();
pieArrow.src = 'res/pie_indicate.png';

var cannonImage_l = new Image(38, 38);
cannonImage_l.src = 'res/cannon_l.png';

var cannonImage_r = new Image(38, 38);
cannonImage_r.src = 'res/cannon_r.png';

var cloud1 = new Image();
cloud1.src = 'res/cloud1.png';
var cloud2 = new Image();
cloud2.src = 'res/cloud2.png';
var cloud3 = new Image();
cloud3.src = 'res/cloud3.png';

var moonImage = new Image();
moonImage.src = 'res/mun.5.png';

var cloudArr = [];
cloudArr.push(cloud1);
cloudArr.push(cloud2);
cloudArr.push(cloud3);

var indicatorArr = [];
var piID = 0;
var Moon = new Moon((canvasWidth / 2) - (44), (canvasHeight / 2) - (33));
var missedPies = 0;
var pieSpeed = 0.05;
var moonSpeed = 0.02;
var dance_speed = 0.4; // cannon wiggle up-down
var lean_speed = 0.2;  // cannon wiggle left-right
var pieScore = 0;
var piScore = 0;
var gridLimitReached = 0; // start scrolling instead of expanding grid
var sizeArr = [4, 6, 8];//, 10];//, 20];//, 24, 32, 40, 60, 70, 200, 999, 1998, 2019, 4444, 6662, 8888, 9999];//
var maxGridDim = sizeArr[sizeArr.length-1] * (sizeArr[sizeArr.length-1]/2);
var s = 0;
var curOffset = 0; //where to place next pidigit
var newStart = 0;
var adjustedLoc = 0;
var size = sizeArr[0]; //piGrid dimensions (columns) (rows = size/2)
var revealed = 0;
var gg1 = new Audio('res/gg1.wav');
var gg2 = new Audio('res/gg2.wav');
var ggs = [];
ggs.push(gg1);
ggs.push(gg2);
var sizeOffset = 0;//controls size of graph axis text size for mobile/pc
var maxHover = 200;//parseFloat(style.transitionDuration.slice(0, -1)) * 100;
var hoverAmt = 0;
var isHovering = 1;
var inTrainingGui = 0; //blocks homemenu interactions from training index gui
var digitsMiss = 0;
var missedDigitsArr = [];
var timeElapsed = 0;
var min = 0;
var sec = 0;
var ms = 0;
var gameOver = false;
var timerStarted = 0;
var bgMusic = new Audio('res/pi_groove.wav');
var chartCtx = document.getElementById("progressGraph");
var playButtonEl = document.getElementById("playButton");
playButtonEl.addEventListener("click", function() {startGame();}, false);
var submitScoreButton = document.getElementById("submitScore");
var uploadMode = 1;
var leatherboardReturnCount = 15;
var leatherBoardOffset = 0;
var maxLeatherboardDepth = 50;
var curTier = 0; //leatherboard scoretier 
var leatherboardPage = 0;
var volumeMult = 1;
var noMorePages = 0; //prevents endless next-page when no more new queries
var indexInput = 0;
var validInput = false;
var maxStarting = 200;
var trainingButtonEl = document.getElementById("trainingButton");
$("#trainingButton").off('click').on('click', toggleTrainingPrompt);
var bgColors = [0x0f479b, 0x0e4295, 0x0b3282, 0x092571];
var piCookie = "";
var pieCookie = "";
var piScores = [];
var pieScores = [];
var gamesPlayed = [];
var gameCount = 0;
var muted = false;
var numpadShown = false;
var graphLoaded = 0;
var progressGraph;
//clearCookies();

window.onload = onload();
function onload() {
	makeNumPad();
	$(".menuIcons").hide();
	getCookies();
}
$(window).focus(function() {
	bgMusic.play();
 });
 
 $(window).blur(function() {
	bgMusic.pause();
 });

 function startGame() {
	if (inTrainingGui) 
		return -1;
	ctx = canvas.getContext("2d");
	loadPi();
	loadKnotty();
	if (detectmob()) {
		$(".menuIcons").show();
	}
	var goSound = new Audio('res/go.wav');
	if (!muted)
		goSound.volume = 0.4;
		goSound.play();

	if (typeof bgMusic.loop == 'boolean')
		{
		    bgMusic.loop = true;
		}
	else
		{
		    bgMusic.addEventListener('ended', function() {
		        this.currentTime = 0;
		        bgMusic.volume = 0.25 * volumeMult;
		        if (!muted)
		        	this.play();
		    }, false);
		}

	bgMusic.volume = 0.25;
	if (!muted)
		bgMusic.play();

	playing = true;
	if (trainingMode)
	{
		moonSpeed = 0.01;
		$(".gameGUI").css({"background-color": "#09295e"});	
		$(".main").css({"border": "3px solid #f2c830", " box-shadow": "0 0 600px 600px #9ecaed;"});		
		$("#trainingIndicator").show();
		start(); 
	}

	$(".homeMenu").hide();
	$(".gameGUI").show();
	$(".gameStage").show();
	if (!trainingMode) {
		$("#timer").show();
		$("#backHomeFromGame").show();
	}
	makeGrid(size);
	spawnCannons(4);
	console.log('pi length: ' + pi.length);
	animate();
}
submitScoreButton.addEventListener("click", function() {
	if (uploadMode) {
		$("#submitPrompt").css({'color': "#f2c830"});
		document.getElementById("submitPrompt").innerHTML = "use your name";
		$(".submitUsername").show();	
		$("#submitUsernameButt").focus();

	}
});

// for offline debugging
function showLeatherboard(b_lim, u_lim) {
	if ($(".leatherboard").is(':visible')){
		$(".leatherboard").hide();
		return 0;
	}
	if (!inTrainingGui){
		var pseudo_result = "<table cellpadding=\"0\" cellspacing=\"0\" class=\"db-table\"><tr><th>user</th><th>pi_score</th><th>pie_score</th><th>time_elapsed</th><tr><td>bepy</td><td>208</td><td>95</td><td>00:11:79</td></tr><tr><td>pooba</td><td>118</td><td>67</td><td>816</td></tr><tr><td>sighmun</td><td>108</td><td>50</td><td>00:33:36</td></tr><tr><td>mmmeh</td><td>108</td><td>48</td><td>00:28:0</td></tr><tr><td>KGGaming</td><td>107</td><td>48</td><td>10003</td></tr><tr><td>boopy</td><td>104</td><td>48</td><td>3807</td></tr><tr><td>yey</td><td>104</td><td>46</td><td>4349</td></tr><tr><td>use ur name</td><td>104</td><td>52</td><td>00:27:0</td></tr><tr><td>ff</td><td>96</td><td>0</td><td>3476</td></tr><tr><td>use your nam</td><td>90</td><td>47</td><td>00:18:34</td></tr><tr><td>bits</td><td>81</td><td>52</td><td>4131</td></tr><tr><td>yeey</td><td>69</td><td>35</td><td>1646</td></tr><tr><td>mmmeh</td><td>65</td><td>24</td><td>00:09:95</td></tr><tr><td>YourNameHere</td><td>64</td><td>20</td><td>00:58:24</td></tr><tr><td>YourNameHere</td><td>58</td><td>19</td><td>00:58:41</td></tr><tr><td>puta</td><td>46</td><td>16</td><td>00:08:17</td></tr><tr><td>puta</td><td>44</td><td>16</td><td>00:10:18</td></tr><tr><td>pooba</td><td>39</td><td>17</td><td>00:17:8</td></tr><tr><td>ziz</td><td>37</td><td>14</td><td>01:28:99</td></tr><tr><td>o</td><td>20</td><td>0</td><td>2132</td></tr><tr><td>jjooo</td><td>18</td><td>10</td><td>635</td></tr><tr><td>angie</td><td>17</td><td>6</td><td>1387</td></tr><tr><td>Nicky</td><td>17</td><td>6</td><td>3208</td></tr><tr><td>mmmeh</td><td>16</td><td>4</td><td>00:01:79</td></tr><tr><td>eee</td><td>15</td><td>3</td><td>00:02:17</td></tr><tr><td>mmmeh</td><td>15</td><td>5</td><td>00:06:84</td></tr><tr><td>pooba</td><td>15</td><td>5</td><td>00:03:80</td></tr><tr><td>Kitty</td><td>15</td><td>4</td><td>3135</td></tr><tr><td>JOE</td><td>14</td><td>5</td><td>00:19:54</td></tr><tr><td>fff</td><td>13</td><td>5</td><td>00:01:82</td></tr><tr><td>fff</td><td>13</td><td>3</td><td>00:04:45</td></tr><tr><td>fff</td><td>12</td><td>2</td><td>00:02:48</td></tr><tr><td>pirv</td><td>11</td><td>5</td><td>00:04:36</td></tr><tr><td>puta</td><td>11</td><td>1</td><td>00:01:59</td></tr><tr><td>fdjskaf</td><td>11</td><td>7</td><td>1031</td></tr><tr><td>reeee</td><td>11</td><td>2</td><td>00:03:43</td></tr><tr><td>ff</td><td>11</td><td>2</td><td>00:01:65</td></tr><tr><td>ggd</td><td>11</td><td>3</td><td>761</td></tr><tr><td>fff</td><td>10</td><td>3</td><td>00:02:13</td></tr><tr><td>mmmeh</td><td>9</td><td>3</td><td>00:02:8</td></tr><tr><td>hi</td><td>7</td><td>1</td><td>213</td></tr><tr><td>ff</td><td>6</td><td>1</td><td>117</td></tr><tr><td>ffff</td><td>6</td><td>1</td><td>00:02:19</td></tr><tr><td>pooba</td><td>5</td><td>2</td><td>278</td></tr><tr><td>f</td><td>4</td><td>0</td><td>108</td></tr><tr><td>dd</td><td>4</td><td>0</td><td>108</td></tr><tr><td>a</td><td>4</td><td>1</td><td>99</td></tr><tr><td>hhh</td><td>4</td><td>1</td><td>142</td></tr><tr><td>ff</td><td>4</td><td>0</td><td>153</td></tr><tr><td>a</td><td>4</td><td>1</td><td>111</td></tr><tr><td>a</td><td>3</td><td>0</td><td>129</td></tr><tr><td>aa</td><td>3</td><td>0</td><td>81</td></tr><tr><td>fdd</td><td>2</td><td>0</td><td>137</td></tr><tr><td>f</td><td>1</td><td>0</td><td>52</td></tr><tr><td>a</td><td>1</td><td>0</td><td>40</td></tr><tr><td>f</td><td>1</td><td>0</td><td>40</td></tr><tr><td>a</td><td>1</td><td>0</td><td>45</td></tr><tr><td>a</td><td>1</td><td>0</td><td>42</td></tr><tr><td>A</td><td>1</td><td>0</td><td>57</td></tr><tr><td>aa</td><td>1</td><td>0</td><td>44</td></tr><tr><td>a</td><td>1</td><td>0</td><td>41</td></tr><tr><td>tt</td><td>1</td><td>1</td><td>234</td></tr><tr><td>fdd</td><td>1</td><td>0</td><td>39</td></tr><tr><td>fdd</td><td>1</td><td>0</td><td>99</td></tr><tr><td>a</td><td>1</td><td>0</td><td>112</td></tr><tr><td>Bad</td><td>0</td><td>0</td><td>0</td></tr><tr><td>hhu</td><td>0</td><td>0</td><td>0</td></tr></table><br />";
		var pseudo_result = "<thead><th>user</th><th>pi_score</th><th>pie_score</th><th>time_elapsed</thead><tr><tbody id=\"guts\"><td>bepy</td><td>208</td><td>95</td><td>00:11:79</td></tr><tr><td>mmmeh</td><td>16</td><td>4</td><td>00:01:79</td></tr><tr><td>eee</td><td>15</td><td>3</td><td>00:02:17</td></tr><tr><td>mmmeh</td><td>15</td><td>5</td><td>00:06:84</td></tr><tr><td>pooba</td><td>15</td><td>5</td><td>00:03:80</td></tr><tr><td>mmmeh</td><td>15</td><td>5</td><td>00:06:84</td></tr><tr><td>pooba</td><td>15</td><td>5</td><td>00:03:80</td></tr><tr><td>mmmeh</td><td>15</td><td>5</td><td>00:06:84</td></tr><tr><td>pooba</td><td>15</td><td>5</td><td>00:03:80</td></tr><tr><td>mmmeh</td><td>15</td><td>5</td><td>00:06:84</td></tr><tr><td>pooba</td><td>15</td><td>5</td><td>00:03:80</td></tr><tr><td>mmmeh</td><td>15</td><td>5</td><td>00:06:84</td></tr><tr><td>pooba</td><td>15</td><td>5</td><td>00:03:80</td></tr></tbody></table><br />";
		//var leatherboard_table = document.getElementById("t");
		//leatherboard_table.insertAdjacentHTML("afterBegin", pseudo_result);
		var t = document.getElementById("t");
		t.insertAdjacentHTML("afterBegin", pseudo_result);

		//loadLeatherboard(b_lim, u_lim);
		$(".leatherboard").show();
	}
}

$(".links a").on("click", function() {
	var t = document.getElementById("t");
	var footer = document.getElementById("leatherFooters");
	t.innerHTML = "";
	if (this.id.split("_")[1] === "arrow"){
		console.log(this.id);
		switch(this.id){
			case "l_arrow":
				if (leatherboardPage > 0)
					leatherboardPage--;
				break;

			case "r_arrow":
					if (!noMorePages) {
						leatherboardPage++;
						break;
					}
		}
	}
	loadLeatherboard(0, max_score, (leatherboardPage * leatherboardReturnCount));
	// pages?
	// else 
	// 	curTier = parseInt(this.id.split("sub")[1]);
	// console.log("curTier " + curTier)
	// if (curTier === 0) 
	// 	loadLeatherboard(0, scoreTiers[0], leatherBoardOffset);
	// else
	// 	loadLeatherboard(scoreTiers[curTier-1], scoreTiers[curTier], leatherBoardOffset);
	t.appendChild(footer);

});

$("#uploadScore").on("click", function() {
	var suppliedUsername = document.getElementById("submitUsernameButt").value;
	if(uploadScore(suppliedUsername, piScore, pieScore, timeElapsed)) {//successful upload
		$(".submitUsername").hide();
		$("#submitScore").css("pointer-events", "none;")
		uploadMode = 0;
		document.getElementById("submitScore").innerHTML = "bits submitted!";
	}
});

$("#cancelUpload").on("click", function() {
	$(".submitUsername").hide();
});

$("#hideLeatherboard").on("click", function() {
	$(".leatherboard").hide();
});

$("#leatherboardButton").on("click", function() {
	var t = document.getElementById("t");
	var footer = document.getElementById("leatherFooters");
	//var footerClone = footer.cloneNode(true);
	t.innerHTML = "";
	loadLeatherboard(0, max_score, 0);
	t.appendChild(footer);
	$(".leatherboard").show();
});

$("#leatherboardOption").on("click", function() {
	var t = document.getElementById("t");
	var footer = document.getElementById("leatherFooters");
	//var footerClone = footer.cloneNode(true);
	t.innerHTML = "";
	loadLeatherboard(0, max_score, 0);
	t.appendChild(footer);
	$(".leatherboard").show();

});

function observeUserScores(user) {
	$.ajax({
		type: "GET",
		url: "retrieve_user_score.php",
		data: {'user': user},
			success: function (result){
			//var array = $.parseJSON(result);
			userQueried = 0;
			$("#queryUserInput").css({'color': '#f4b41c'});
			let loadedPiScores = [];
			let loadedPieScores = [];
			let loadedtimeElapsed = [];
			let scores = result.split("|");
			for (let r = 0; r < scores.length; r++) {
				loadedPiScores.push(parseInt(scores[r].split(" ")[0]));
				loadedPieScores.push(parseInt(scores[r].split(" ")[1]));
				loadedtimeElapsed.push(scores[r].split(" ")[2]);
			}
			loadedPieScores.pop();
			loadedPiScores.pop(); //last element would be nan
			console.log("result: " + result);
			console.log("piScores: " + loadedPiScores + " pieScores: " + loadedPieScores);
			if (loadedPiScores.length === 0) 
				return -1;
			loadGraph(loadedPiScores, loadedPieScores, userQuery);

		},
			error: function(result) {
				console.log("FAILure : " + JSON.stringify(result));
				return "null";
			}
	});
}

function loadLeatherboard(bottomLim, upperLim, leatherBoardOffset) {

	$.ajax({
		type: "GET",
		url: "retrieve.php",
		data: {'bottom_lim': bottomLim, 'upper_lim': upperLim, 'return_count' : leatherboardReturnCount, 'offset': leatherBoardOffset},
			success: function (result){
			//var array = $.parseJSON(result);
			console.log("result: " + result);
			if (result.length < 130) { // header is around 120 chars.. hacky but it works....
				noMorePages = 1;
				return;
			} else {
				noMorePages = 0;
				document.getElementById("t").insertAdjacentHTML("afterBegin", result);

			}
		},
			error: function(result) {
				console.log("FAILure : " + JSON.stringify(result));
			}
	});
}

//TODO: if username exists 5 times already, replace lowest existing score..?
function uploadScore(suppliedUsername, piScore, pieScore, timeElapsed){
	var regx = /^[A-Za-z0-9]+$/;
	var regx = /^[\w]+([-_\s]{1}[a-z0-9]+)*$/i;//allows alphanums and single spaces, hyphens, and underlines
	//console.log("checking supplied user across " + knottyWords.length + " knotty words");

	if (!regx.test(suppliedUsername) || suppliedUsername.length > 12 || suppliedUsername.length === 0 || knottyWords.includes(suppliedUsername)) {
		$("#submitPrompt").css({'color': "#ff6f5e"})
		document.getElementById("submitPrompt").innerHTML = "invalid name! ꐦಠ皿ಠ";
		return 0;
	}
	if (pieScore === 0) {
		$("#submitPrompt").css({'color': "#ff6f5e"})
		document.getElementById("submitPrompt").innerHTML = "pieScore too low.. ╥﹏╥";
		return 0;
	}

	var timeString = returnTime(timeElapsed);
	//console.log('Uploading pi_score: {0} pie_score: {1} in {2} for {3}'.format(piScore, pieScore, timeString, suppliedUsername))
	$.ajax({
		type: "POST",
		url: "upload.php",
		data: {'name': suppliedUsername, 'pi_score': piScore, 'pie_score': pieScore, 'time_elapsed': timeString},
			success: function (result){
			//var array = $.parseJSON(result);
			console.log("result: " + result);
		},
			error: function(result) {
				console.log("FAILure : " + JSON.stringify(result));
			}
	});
	document.getElementById("submitPrompt").innerHTML = "use your name";
	return 1;
}

function toggleTrainingPrompt() {
	inTrainingGui = !inTrainingGui;
	$(".indexGui").show();
	$("#startTraining").click(function() {
		indexInput = parseInt(document.getElementById("startingIndex").value);
		console.log(indexInput);

		if (Number.isInteger(indexInput) && (indexInput < maxStarting)) {
			if (detectmob()) {
				setTimeout(function(){ //allow resizing.. 
					inTrainingGui = 0;
					trainingMode = true;
					validInput = true;
					loadPiTraining(indexInput);		
					$(".indexGui").hide();	
				}, 500); 
			} else {
				inTrainingGui = 0;
				trainingMode = true;
				validInput = true;
				loadPiTraining(indexInput);		
				$(".indexGui").hide();				}
		}
		else {
			document.getElementById("indexPrompt").innerHTML = "( •ˋ _ ˊ• ) must be less than " + maxStarting + "..";
			document.getElementById("indexPrompt").style.color = "#ffd480";
			indexInput = 0;
		}	 	
	});
	$("#cancelTraining").unbind().click(function() {
		location.reload();// lazy! but just .hide()'ing introduced weird dupe bug so..
	});	
}

function setCookies() {
	Cookies.set('piScoresCookie', piScores.join('|'));
	Cookies.set('pieScoresCookie', pieScores.join('|'));
	document.cookie = "cookie_name=piScoresCookie; max-age=31536000; path=/";
	document.cookie = "cookie_name=pieScoresCookie; max-age=31536000; path=/";
}

function getCookies() {
	if (Cookies.get('piScoresCookie') != null) {
		piCookie = Cookies.get('piScoresCookie');
	}
	else {
		piCookie = "-1";
	}
	if (Cookies.get('pieScoresCookie') != null) {
		pieCookie = Cookies.get('pieScoresCookie');
	}
	else {
		pieCookie = "-1";
	}
	piCookie.split("|").forEach(function (score) {
		piScores.push(parseInt(score));
		gameCount++;
		gamesPlayed.push(gameCount);
	});
	pieCookie.split("|").forEach(function (score) {
		pieScores.push(parseInt(score));
	});

	console.log('piScores: ' + piScores);
	console.log('pieScores: ' + pieScores);
	if (piScores[0] == -1)
		piScores.shift();
	if (pieScores[0] == -1)
		pieScores.shift();
}

function clearCookies() {
	Cookies.remove('piScoresCookies');
	Cookies.remove('pieScoresCookies');	
	var piCookie = "";
	var pieCookie = "";
	var piScores = [];
	var pieScores = [];
	var gamesPlayed = [];
	var gameCount = 0;
}

function loadGraph(givenPiScores, givenPieScores, user) {
	var avgPiScore = Math.floor((givenPiScores.reduce((a, b) => a + b, 0)) / givenPiScores.length);
	var avgPieScore = Math.floor((givenPieScores.reduce((a, b) => a + b, 0)) / givenPieScores.length);
	var bigtab = "&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;"
	document.getElementById("avgScores").innerHTML = "average piScore: " + avgPiScore + bigtab + " average pieScore: " + avgPieScore;
	console.log(givenPiScores + " | " + givenPieScores);

	if (!detectmob())
		sizeOffset = 4;

	var title_suffix = user.slice(-1) === "s" ? "' scores'" : "'s scores";
	var t = "   " + user + title_suffix;
	if (user.length === 0)
		t = "  thy scores, my liege";

	let scoreLength = givenPieScores === 0 ? 1 : givenPieScores.length-1;
	try {
		gamesPlayed = Array.from(Array(scoreLength).keys());
	}
	catch(err) {
		console.log(err);
		gamesPlayed = [];
	}

	progressGraph = new Chart(chartCtx, {
		type: 'line',
		data: {
			labels: gamesPlayed,
			datasets: [{
				label: "pie score",
				data: givenPieScores,
				backgroundColor: "rgba(255, 204, 53, 0.8)",
				borderColor: "rgb(219, 168, 17)",
				pointHoverRadius: 8,
				pointHoverBackgroundColor: "rgb(255, 238, 191)"
			}, {
				label: "pi score",
				data: givenPiScores,
				backgroundColor: "rgba(79, 247, 244, 0.5)",
				borderColor: "rgb(43, 136, 219)",
				borderWidth: 2,
				pointHoverRadius: 8,
				pointHoverBackgroundColor: "rgb(141, 207, 244)"

			}]
		},
		options: {
			title: {
				display: true,
				fontFamily: "sliced",
				fontColor: "white",
				fontSize: 22 + sizeOffset,
				text: t
			},
			tooltips: {
				callbacks: {
					title: function(tooltipItem, data) {
						return ""
					}
				}
			},
			legend: {
				display: false
			},
			scales: {
				xAxes: [{
					scaleLabel: {
						display: true,
						labelString: 'passionate effort no.',
						fontColor: "white",
						fontFamily: "sliced",
						fontSize: 18 + sizeOffset
					},
					ticks: {
						fontColor: "white",
						fontFamily: "sliced",
						fontSize: 12 - sizeOffset
					}
				}],
				yAxes: [{
					scaleLabel: {
						display: true,
						fontColor: "white",
						fontSize: 16 + sizeOffset,
						fontFamily: "sliced",
						labelString: 'score'
					},
					ticks: {
						fontColor: "white",
						beginAtZero: true,
						fontFamily: "sliced",
						fontSize: 15 
					}
				}]
			}
		}
	});
	graphLoaded = 1;
}

function Cannon(x, y, type, ID) {
	this.x = x;
	this.y = y;
	this.direction = Math.random() < 0.5 ? -1 : 1;
	this.type = type;
	this.ID = ID;

	var og_y = y;
	var max_dip = 20;
	var og_x = x;
	var max_lean = 5;

	this.draw = function() {
		if (this.type == 'left') {
			ctx.drawImage(cloudArr[0], this.x, this.y + 10, 80, 50);
			ctx.drawImage(cannonImage_l, this.x + 14, this.y + 8, 38, 27);
		}
		else if (this.type == 'right') {
			ctx.drawImage(cloudArr[1], this.x - 25, this.y, 80, 45);
			ctx.drawImage(cannonImage_r, this.x, this.y, 38, 27);
		}
		let y_inc = Math.random() * dance_speed;
		if (this.y + (y_inc * this.direction) < og_y) 
			this.direction = 1;
		else if (this.y + (y_inc * this.direction) > og_y + max_dip)
			this.direction = -1;
		this.y += (y_inc * this.direction);

		let x_inc = Math.random() * lean_speed;
		if (this.x + (x_inc * this.direction) < og_x) 
			this.direction = 1;
		else if (this.x + (x_inc * this.direction) > og_x + max_lean)
			this.direction = -1;
		this.x += (x_inc * this.direction);
	}
	this.update = function() { this.draw(); }
}

function Moon(x, y) {
	this.x = x;
	this.y = y;
	this.pathAngle = 0;
	this.time = 0;

	this.draw = function() {
		ctx.drawImage(moonImage, this.x, this.y);
	}

	this.update = function() {
		this.time += moonSpeed;
		scale = 200 / (3 - Math.cos(2*this.time));
		this.y = y + scale * Math.cos(this.time);
		this.x = x + scale * Math.sin(2*this.time) / 2;
		this.draw();
	}
}

function OffscreenIndicator(x, Vx, type) {
	this.x = x;
	this.Vx = Vx;
	this.type = type;

	this.draw = function() { ctx.drawImage(pieArrow, this.x, 20); }

	this.update = function() {
		if (type == 'left')
			this.x -= this.Vx / 10;
		else if (type == 'right')
			this.x += this.Vx / 10;
		this.draw();	
	}
}

function Pie(x, y, angle, vi) {
	this.x = 0;
	this.y = 0;
	this.angle = angle * Math.PI / 180;
	this.vi = vi;
	this.time = 0;
	this.dx = 0;
	this.dy = 0;
	this.vx = 0;
	this.out = false;
	this.type = '';
	this.offscreen = false;
	this.pushed = false;

	this.draw = function(){ ctx.drawImage(pieImage, this.x, this.y); }

	this.update = function() {

		if (!this.out) {
			if (x < 314) {//left cannons
				this.x = x + (this.vi * Math.cos(this.angle) * this.time);
				this.type = 'left';
			}
			else if (x > 314) {//right cannons
				this.x = (x - (this.vi * Math.cos(this.angle) * this.time));
				this.type = 'right';
			}
				this.y = (y + (0.5 * gAcc * this.time * this.time) + (this.vi * Math.sin(this.angle) * this.time)); 	
				this.vx = -(Math.cos(this.angle) * this.vi);

			if (this.y < 0) 
				this.offscreen = true;

			else if (this.y > 0)
				this.offscreen = false;

			if (this.offscreen) {
				if (!this.pushed) {
					this.oi = new OffscreenIndicator(this.x, this.vx, this.type);
					this.pushed = true;
				}
				this.oi.update();
			}

			if (!this.offscreen) {
				indicatorArr.splice(indicatorArr.length - 1, 1);
				this.pushed = false;
			}

			if (((this.x >= Moon.x) && (this.x <= Moon.x + moonImage.width))  && ((this.y >= Moon.y) && (this.y <= Moon.y + moonImage.height)))
			{
				var moonGobble = new Audio('res/moonGobble.wav');
				moonGobble.volume = 0.54;
				if (!muted)
					moonGobble.play();
				this.out = true;
				pieScore++;
				moonSpeed += 0.00014;
				$("#pieScore").text("pie score: ".concat(pieScore.toString()));
			}

			this.draw();
			pieAmmo.splice(piID, 1);

			this.time += 0.05;//pieSpeed;
		}
		if ((this.y > 314)) {
			this.out = true;
			missedPies++;
		}
	}
}

function animate() {
	if (playing) {
		requestAnimationFrame(animate);
		ctx.clearRect(0,0, canvasWidth, canvasHeight);
		for (var p = 0; p < pieAmmo.length; p++)
			pieAmmo[p].update();

		for (c = 0; c < cannonArmory.length; c++)
			cannonArmory[c].update();

		Moon.update();
	}
	if (!playing) {
		moonSpeed = 0.009; //slo-mo moon on lose screen
		Moon.update();
	}
}

$(document).ready(function() {
	$("#holdMyPi").load("https://raw.githubusercontent.com/asthecroweflies/pipassion/master/pi_mil.txt");
	$("#knottyWords").load("https://raw.githubusercontent.com/RobertJGabriel/Google-profanity-words/master/list.txt");
});

function loadKnotty() {
	var knottyNode = document.getElementById('knottyWords');
	knottyWords = knottyNode.textContent.split("\n");
}

function loadPi() {
	var piNode = document.getElementById('holdMyPi');
	pi = piNode.textContent;
}

function doPi(amt) {
	if (playing)
		var bgFillColor = "#2ff1aa";
	else
		var bgFillColor = "#99ff99";

	streak_count++;
	if (streak_count >= 20 && cannonArmory.length < 4) {
		spawnCannons(1);
		streak_count = 0;
	}
	if (!timerStarted) {
		start();
		timerStarted = true;
	}

	for(var skip = 0; skip < amt; skip++) {
			shootPie();
			if (!gridLimitReached) {
				$("#piGrid").children('.grid').eq(cur).text(pi[cur]);
				// $("#piGrid").children('.grid').css({'opacity': '50%;'});
				if (missedDigitsArr[missedDigitsArr.length-1] == cur) {
					$("#piGrid").children('.grid').eq(cur).css({'background-color': "#ff6f5e"});
				}
				else
					$("#piGrid").children('.grid').eq(cur).css({'background-color': bgFillColor});
			} else {
				newStart = sizeArr[s];
				//var adjustedLoc = ((cur-newStart*((sizeArr[sizeArr.length-1]/2)-1)) % (maxGridDim));
				//adjustedLoc = adjustedLoc < newStart ? adjustedLoc + newStart * (1) : adjustedLoc;
				adjustedLoc = newStart + curOffset;//(cur % maxGridDim);
				//console.log("starting from " + newStart + " will fill unto: " + (maxGridDim));
				//console.log("grid pos: " + adjustedLoc + " should have " + pi[cur]);
				$("#piGrid").children('.grid').eq(adjustedLoc).text(pi[cur]);
				if (missedDigitsArr[missedDigitsArr.length-1] == cur) {
					$("#piGrid").children('.grid').eq(adjustedLoc).css({'background-color': "#ff6f5e"});
				}
				else
					$("#piGrid").children('.grid').eq(adjustedLoc).css({'background-color': bgFillColor});
			}
			cur += 1;
			curOffset += 1;
			if (playing)
				piScore++;
			$("#piScore").text("pi score: ".concat(piScore.toString()));
			if((cur === size * (size / 2)) || ((curOffset === maxGridDim - sizeArr[sizeArr.length-1]) && gridLimitReached))
			{
				s++;
				if (cur >= maxGridDim && !gridLimitReached) {
					s = sizeArr.length-1;
					curOffset = 0;
					gridLimitReached = 1;
				}
				else if (curOffset === (maxGridDim - sizeArr[sizeArr.length-1])) {
					s = sizeArr.length-1;
					curOffset = 0;
					gridLimitReached = 1;
				}
				size = sizeArr[s];
				$(".grid").remove();
				$(".grid").css("background-color", "#ffffff")
				makeGrid(size);
				if (!gridLimitReached) {
					for (var digit = 0; digit < cur; digit++)//repop pi
					{
						$("#piGrid").children('.grid').eq(digit).text(pi[digit]);
						$("#piGrid").children('.grid').eq(digit).css({'background-color': "#2ff1aa"});
					}
					for (var missedDigitIndex = 0; missedDigitIndex < missedDigitsArr.length; missedDigitIndex++){
						$("#piGrid").children('.grid').eq(missedDigitsArr[missedDigitIndex]).css({'background-color': "#ff6f5e"})
					}
				}
				else { // scroll pi; show last row of correct digits, clear next l-1 rows 
					for (var digit = 0; digit < sizeArr[s]; digit++)//repop last row as first row
					{
						$("#piGrid").children('.grid').eq(digit).text(pi[cur-sizeArr[s]+digit]);
						$("#piGrid").children('.grid').eq(digit).css({'background-color': "#2ff1aa"});
					}
					for (var missedDigitIndex = 0; missedDigitIndex < missedDigitsArr.length; missedDigitIndex++){
						var mdi = missedDigitsArr[missedDigitIndex];
						var loc = missedDigitsArr[missedDigitIndex]-cur+sizeArr[s]; //if missed digit in last row, show!
						if (mdi > (cur - maxGridDim) && loc >= 0) //missed a digit in last row of previous grid..
							$("#piGrid").children('.grid').eq(loc).css({'background-color': "#ff6f5e"});
					}
				}
			}
		}
}

function revealPi() {
	var revealAmt = 5;
	if ((revealed < revealAmt) && !playing) {
		setTimeout(function() {
			revealed++;
			if (playing)
				return;
			revealPi();
			doPi(1);
		}, 314);
	} 
}

function makeGrid(size) {
	var rows = size / 2;
	var columns = size;
	var isMobile = detectmob();
	var newFontSize = "2vmin";
	var newLineHeight = 0;
	if (isMobile) {
		newFontSize = ((256 / size) * 0.05).toString().concat("vmax");
		newLineHeight = ((400 / Math.pow(2, (Math.log2(size)))) * 0.8).toString().concat("px"); // 'centers' digits in grid square
		//newLineHeight = "0.5vmin";
	} else {
		newFontSize = ((256 / size) * 0.1).toString().concat("vmin");
		newLineHeight = ((400 / Math.pow(2, (Math.log2(size)))) * 1.34).toString().concat("px"); 
	}
	
	for (var row = 0; row < rows; row++) {
		for (var col = 0; col < columns; col++) {
			$("#piGrid").append("<div class='grid' style='opacity: 100%'>π</div>");
		};
	};
	//console.log("w: " + $("#piGrid").width() + " h: " + $("#piGrid").height());
	//console.log("columns: " + columns + " rows: " + rows + " newLineHeight: " + newLineHeight + " newFontSize: " + newFontSize);

	if (isMobile) {
		var gridW = ($("#piGrid").width()/columns * 0.99).toFixed(2);
		//var gridW = ($("#piGrid").width()/columns * 1).toFixed(2);
		var gridH = ($("#piGrid").height()/rows * 1).toFixed(2);
		$(".grid").width(gridW);
		$(".grid").height(gridH);
		//console.log("gridH : " + gridH + " gridW: " + gridW);

	} else {
//		if (piScore < 8) 
//		$(".grid").width($("#piGrid").width()/columns*0.99);
//		#else 
		$(".grid").width($("#piGrid").width()/columns);

		$(".grid").height($("#piGrid").height()/rows);
	}
	$(".grid").css("font-size", newFontSize)
	$(".grid").css("font-color", "#ffffff");
	$(".grid").css("line-height", newLineHeight);	
}

function makeNumPad() {
	var isMobile = detectmob();
	var nums = [7, 8, 9, 4, 5, 6, 1, 2, 3, 0, "."]
	for (var d = 0; d < nums.length; d++) {
		$("#numPad").append("<div class='numPadDigit'></div>")
		$("#numPad").children('.numPadDigit').eq(d).text(nums[d]);
	}
	if (isMobile) {
		$(".numpadDigit").children('.numPadDigit').css({'font-size': '6.8vmin'});
		// Zero
		$("#numPad").children('.numPadDigit').eq(9).css({'width': '54%'});
		$("#numPad").children('.numPadDigit').eq(9).height("20%;");
		// Decimal
		$("#numPad").children('.numPadDigit').eq(10).width("20%;");
		$("#numPad").children('.numPadDigit').eq(10).height("20%;");
	}
	else {
	// Zero
	$("#numPad").children('.numPadDigit').eq(9).width(335);
	$("#numPad").children('.numPadDigit').eq(9).height(130);
	// Decimal
	$("#numPad").children('.numPadDigit').eq(10).width(162);
	$("#numPad").children('.numPadDigit').eq(10).height(130);	
	}
}

$(".numPadDigit").click(function() {
	var t = $(this).text();
    var event = new KeyboardEvent('keydown', {
		key: t,
	  });
	  document.dispatchEvent(event);
});

$("#yesGame").click(function() {
	var newGameNoise = new Audio('res/playAgain.wav');
	newGameNoise.volume = 0.4;
	if (!muted)
		newGameNoise.play();
	newGame();
});

$("#noGame").click(function() {
	/*
	reset();
	$(".gameGUI").hide();
	$("#timer").hide();
	$(".gameStage").hide();
	$(".gameOver").hide();
	$(".homeMenu").show();.. buggy
	*/
	location.reload();
});

$("#soundButton").click(function() {
	if (!muted) {
		document.getElementById("soundButton").style.backgroundImage = "url('res/soundMuted.png')";
		bgMusic.muted = true;
	}
	else {
		document.getElementById("soundButton").style.backgroundImage = "url('res/soundIcon.png')";
		bgMusic.muted = false;
	}
	muted = !muted;
});

$("#numpadButton").click(function() {
	if (playing === true) {
		if (!numpadShown) {
			if (detectmob() === false) {
				$(".menuIcons").css({'right': '-760px','position': 'absolute','width':'700px','top':'12%'});
				$(".menuIcons").show();
			} else {
				$(".menuIcons").css({'right': '','position': 'absolute','width':'','top':''});
				$(".menuIcons").show();
			} 
		}
		else {
			$(".menuIcons").hide();
		}
		numpadShown = !numpadShown;
	}
});

$("#progressButton").click(function() {
	loadGraph(piScores, pieScores, "");
	if (!inTrainingGui) {
		$(".homeMenu").hide();
		$(".graph").show();
	}
});

$("#backHomeFromGraph").click(function() {
	$(".graph").hide();
	$(".homeMenu").show();
})

$("#observeUser").click(function() {
	userQueried = 1;
	userQuery = document.getElementById("queryUserInput").value;		
	observeUserScores(userQuery);
});

$("#backHomeFromGame").click(function() {
	//$(".homeMenu").show();
	location.reload();
})

document.addEventListener('keydown', (event) => {
	const keyPressed = event.key;
	//console.log("pressed " + keyPressed)
	if (playing) {
  	  if ((keyPressed == 'y') && gameOver){
		//newGame();
		return;
	  }
	  if ((keyPressed == 'x') && trainingMode){
		location.reload();
		return;
	  }
	  if (keyPressed === pi[cur])
	  {
		doPi(1);
	  	return;
	  }
	  if (keyPressed === 'p')
	  {
	  	//doPi(1); //cheeky!
	  	return;
	  }
	  else {
		var loc = 0;
		if (gridLimitReached) {
			newStart = sizeArr[s];
			loc = newStart + curOffset;//(cur % maxGridDim);
		} else
			loc = cur;

		streak_count = 0;
	  	digitsMiss++;

	  	missedDigitsArr.push(cur);
		$("#piGrid").children('.grid').eq(loc).text(pi[cur]);
		if (!trainingMode)
			$("#piGrid").children('.grid').eq(loc).css({'background-color': '#ffd43a'});
		else
			$("#piGrid").children('.grid').eq(loc).css({'background-color': '#ffd43a'});

	  	if (!trainingMode) {
	  		explodeCannon();
	  	}
	  		/*var darkenAmt = 0x000F;
	  		for (bgC = 0; bgC < bgColors.length; bgC++) {
	  			bgColors[bgC] = (bgColors[bgC] - darkenAmt).toString(16);
	  		}

	  		var bgCSS = "linear-gradient(-62deg, #" + bgColors[0].toString() + ", #" + bgColors[1].toString() + ", #" + bgColors[2].toString() + ", #" + bgColors[3].toString() +")";
	  		console.log(bgCSS);
	  		$("body").css({'background': bgCSS});
	  	}
*/
	  	else {
	  		if (digitsMiss > 30)//just give it to 'em..
	  		{
	  			doPi(1); 
	  			digitsMiss = 0;
	  			return;
	  		}
	  		var digitMissSound = new Audio('res/digitMiss.wav');
	  		digitMissSound.volume = (0.5 * digitsMiss) % 1;
	  		if (!muted)
	  			digitMissSound.play();
	  		return;
	  	}
	  }
  	if (cannonArmory.length == 0)
		playing = false;

	if (!playing) {
		gameOver = true;
		endGame();
	}
}
	else { 
		if (keyPressed.keyCode == 13|| keyPressed.which == 13 || keyPressed === 'Enter' || keyPressed == ' ')
		{
			//startGame();
			return;
		}
	} 
}, false);

function shootPie() {
	var cannonFire = new Audio('res/cannonFire_now.wav');
	cannonFire.volume = 0.3;

	if (!trainingMode) 
		if (!muted)
			cannonFire.play();

	else if (trainingMode) {
		if (!muted) {
			if (ms >= 10) {
				cannonFire.play();
			}
		}
	}

	var angle = 0;
	var force = 0;
	var randomNum = function(min, max) { return Math.floor(Math.random() * (min - max) + min);}

	switch(currCannon % cannonArmory.length)
	{
		case 0:
			if (cannonArmory[0].ID == 0) {
				if (Math.random() <= 0.25)
					pieAmmo.push(new Pie(cannonArmory[0].x + 30, cannonArmory[0].y, -randomNum(30, 50), randomNum(60, 100)));//function Pie(x, y, angle, vi)
				else 
					pieAmmo.push(new Pie(cannonArmory[0].x + 30, cannonArmory[0].y, -randomNum(40, 50), randomNum(40, 60)));
				break;				
			}
		case 1:
			if (cannonArmory[1].ID == 1) {
				pieAmmo.push(new Pie(cannonArmory[1].x + 30, cannonArmory[1].y + 4, -randomNum(40, 55), randomNum(70, 80)));
				break;				
			}
		case 2:
			if (cannonArmory[2].ID == 2) {
				if (Math.random() <= 0.25)
					pieAmmo.push(new Pie(cannonArmory[2].x + 3, cannonArmory[2].y + 4, -randomNum(40, 30), randomNum(100, 180)));
				else
					pieAmmo.push(new Pie(cannonArmory[2].x + 3, cannonArmory[2].y + 4, -randomNum(40, 30), randomNum(50, 70)));
				break;				
			}

		case 3:
			if (cannonArmory[3].ID == 3) {
				pieAmmo.push(new Pie(cannonArmory[3].x + 3, cannonArmory[3].y + 4, -randomNum(60, 89), randomNum(70, 80)));
				break;				
			}

		default:
			break;
	}
	currCannon++;
	piID++;
}

function explodeCannon() {
	var cannonPop = new Audio('res/cannonPop2.wav');
	cannonPop.volume = 0.6;
	if (!muted)
		cannonPop.play();
	cannonArmory.splice(cannonArmory.length-1, 1);
}

function spawnCannons(count) {
	if (count === 4) {
		cannonInfo.push(Math.floor(Math.random() * 100) + 20); cannonInfo.push(Math.floor(Math.random() * 100) + 20); cannonInfo.push('right');
		cannonInfo.push(Math.floor(Math.random() * 100) + 20); cannonInfo.push(Math.floor(Math.random() * 100) + 135); cannonInfo.push('right');
		cannonInfo.push(Math.floor(Math.random() * 100) + 450); cannonInfo.push(Math.floor(Math.random() * 100) + 20); cannonInfo.push('left');
		cannonInfo.push(Math.floor(Math.random() * 100) + 450); cannonInfo.push(Math.floor(Math.random() * 100) + 150); cannonInfo.push('left');
	
		cannonArmory.push(new Cannon(cannonInfo[0], cannonInfo[1], cannonInfo[2], 0));
		cannonArmory.push(new Cannon(cannonInfo[3], cannonInfo[4], cannonInfo[5], 1));
		cannonArmory.push(new Cannon(cannonInfo[6], cannonInfo[7], cannonInfo[8], 2));
		cannonArmory.push(new Cannon(cannonInfo[9], cannonInfo[10], cannonInfo[11], 3));
	} else if (count === 1) {
		var missing_cannon_id = cannonArmory.length;
		cannonArmory.push(new Cannon(cannonInfo[missing_cannon_id * 3], cannonInfo[missing_cannon_id * 3 + 1],
								     cannonInfo[missing_cannon_id * 3 + 2], missing_cannon_id));
	}
}

function newGame() {
	reset();
}

function start() {
	stopwatch();
}

function stopwatch() {
	if (playing)
	{
		setTimeout(function() {
			timeElapsed++;
			document.getElementById("timer").innerHTML = returnTime(timeElapsed);
			stopwatch();
		}, 10);
	}
}

function returnTime(timeElapsed) {
	min = Math.floor(timeElapsed / 100 / 60);
	sec = Math.floor(timeElapsed / 100);
	ms = timeElapsed % 100;

	if (min < 10) 
		min = "0" + min;
	if (sec >= 60)
		sec = sec % 60;
	if (sec < 10)
		sec = "0" + sec;
	if (ms < 10)
		ms = "0" + ms;

	return timeString = min + ":" + sec + ":" + ms;
}

function endGame() {
	var gg1 = new Audio('res/gg1.wav');
	gg1.volume = 0.48;
	if (!muted)
		gg1.play();
	bgMusic.pause();
	gameOver = true;
	revealPi();
	document.getElementById('finalPiScore').innerHTML = "<span style='color: #cc1010'>pi score: <span><span style='color: #f75959'><span>" + piScore + " digits <span>";
	document.getElementById('finalPieScore').innerHTML = "<span style='color: #cc1010'>pie score: <span> " + "<span style='color: #f75959'><span>" + pieScore + " moon pies";

	if (ms < 10)
		ms = "0" + ms;
	document.getElementById('timeTaken').innerHTML = "<span style='color: #cc1010'>time: <span> <span style='color: #ffa0a0'><span>" + min + "m " + sec + "s " + ms + "ms";

	piScores.push(piScore);
	pieScores.push(pieScore);
	console.log(piScores);
	setCookies();
	$(".gameOver").show();
}

function reset() {
	$(".gameOver").hide();
	$("#gameCanvas").removeClass("animate");
	$("#gameCanvas").width(); // trigger a DOM reflow
	$("#gameCanvas").addClass("animate");
	ctx.restore();
	//var Moon = new Moon((canvasWidth / 2) - (44), (canvasHeight / 2) - (33));
	document.getElementById("submitScore").innerHTML = "submit ya bits";
	$(".submitScore").css("pointer-events", "auto;")
	uploadMode = 1;
	newStart = 0;
	cur = 0; //current index in pi
	pieAmmo = [];
	cannonArmory = [];
	currCannon = 0;
	dance_speed = 0.4;
	lean_speed = 0.2;
	pieSpeed = 0.05;
	moonSpeed = 0.02;
	pieAmt = 0;
	pieCount = 0;
	revealed = 0;
	curOffset = 0;
	indicatorArr = [];
	piID = 0;
	missedPies = 0;
	s = 0;
	size = sizeArr[s]; //piGrid dimensions (columns) (rows = size/2)
	gridLimitReached = 0;
	digitsMiss = 0;
	missedDigitsArr = [];
	timeElapsed = 0;
	min = 0;
	sec = 0;
	ms = 0;
	timerStarted = 0;
	$("#piGrid").empty();
	pieScore = 0;
	piScore = 0;
	document.getElementById("timer").innerHTML = "00:00:00 - good luck this time!";
	$("#piScore").text("pi score: 0");
	$("#pieScore").text("pi score: 0");
	startGame();
}

function loadPiTraining(index) {
	startGame();
	if (index < 200)
		doPi(index);
}

// $(".homeMenu span").mouseover(
//   function(){
// 	var plopNoise = new Audio('res/menuHover.wav');
// 	plopNoise.volume = 0.4;
// 	if (!muted)
// 		plopNoise.play();
// 	isHovering = 1;
//     incInterval = setInterval(function(){
// 	  //document.getElementById("myID").innerHTML = num;  
//       hoverAmt++;
//     },10);
//   }
// );

$("#piePic").mouseover(
	function(){
	  if ($(".leatherboard").is(':visible'))
	  	return -1;
	  var plopNoise = new Audio('res/menuHover.wav');
	  plopNoise.volume = 0.31;
	  //if (!muted)
	  //plopNoise.play();
	  isHovering = 1;
		incInterval = setInterval(function(){
			if (isHovering) {
				//console.log(hoverAmt + " - " + isHovering)
				if (hoverAmt > maxHover) {
					startGame();
				}
				hoverAmt++;
			} else {
				return 0;
			}
		},10);
	}
  );

$("#piePic").mouseout(
	 function(){
		if ($(".leatherboard").is(':visible'))
			return -1;
		isHovering = 0;
		hoverAmt   = 0 ;
	// var style;
	// style = getComputedStyle(document.querySelector('#piePic'));
	// if (hoverAmt > maxHover) {
	// 	startGame();
	// }

	// var vol = hoverAmt / maxHover;
	// clearInterval(incInterval);
	// setTimeout(function() {
	// 	thud2.volume = vol;
	// 	if (!isHovering && !muted)
	// 		thud2.play();
	//   }, hoverAmt * 10);
	//  hoverAmt = 0;
});


// Originally would play 'thud' noise on menu item hittin the ground based on hover duration--this got annoying
//$(".homeMenu span").mouseout(
//   function(){
// 	isHovering = 0;
// 	var style;
// 	style = getComputedStyle(document.querySelector('.homeMenu span'));
// 	maxHover = parseFloat(style.transitionDuration.slice(0, -1)) * 100;
// 	if (hoverAmt > maxHover) 
// 		hoverAmt = maxHover;
// 	var vol = hoverAmt / maxHover;
// 	clearInterval(incInterval);
// 	setTimeout(function() {
// 		thud2.volume = vol;
// 		if (!isHovering && !muted)
// 			thud2.play();
// 	  }, hoverAmt * 10);
// 	 hoverAmt = 0;
// });

function detectmob() { 
 if( navigator.userAgent.match(/Android/i)
 || navigator.userAgent.match(/webOS/i)
 || navigator.userAgent.match(/iPhone/i)
 || navigator.userAgent.match(/iPad/i)
 || navigator.userAgent.match(/iPod/i)
 || navigator.userAgent.match(/BlackBerry/i)
 || navigator.userAgent.match(/Windows Phone/i)
 ){
    return true;
  }
 else {
    return false;
  }
}

String.prototype.format = function() {
	a = this;
	for (k in arguments) {
	  a = a.replace("{" + k + "}", arguments[k])
	}
	return a
  }

//console.log(detectmob());
})(window, jQuery)