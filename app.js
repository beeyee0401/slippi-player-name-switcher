// Assumes 2v2 games
const { default: SlippiGame } = require('slp-parser-js');
const fs = require('fs');
const config = require('./config.json');
var fileAlreadyProcessed = null;

function findFirstOut(file){
	var firstOutOnLosingTeam = null;
	try {
		const game = new SlippiGame(config.slippiReplayFolder + file);
		const settings = game.getSettings();
		const stats = game.getStats();
		const frames = game.getFrames();

		if (stats.gameComplete){
			var playerTeamMapping = {};
			for (var i = 0; i < settings.players.length; i++){
				if (!(settings.players[i].teamId in playerTeamMapping)){
					playerTeamMapping[settings.players[i].teamId] = [settings.players[i].playerIndex];
				} else {
					playerTeamMapping[settings.players[i].teamId].push(settings.players[i].playerIndex);
				}
			}
			
			var losingTeamId = checkFrameForLosingTeam(playerTeamMapping, frames[stats.lastFrame]);
			// if this is null, it's because they died very close to the same time
			// the data format is different if the teammates died at close to the same time
			if (losingTeamId === null){
				losingTeamId = checkFrameForLosingTeam(playerTeamMapping, frames[stats.lastFrame - 1]);
			}

			firstOutOnLosingTeam = findFirstPlayerOut(playerTeamMapping[losingTeamId], frames, stats.lastFrame);
		}
	}
	catch (error) {
		// It errors sometimes in the 3rd party slp parser, so just do nothing and wait for next run
		console.log(error);
	}
	return firstOutOnLosingTeam;
}

function findFirstPlayerOut(losingTeamArr, frames, lastFrame){
	var firstPlayerOut = null;
	// Need the lastFrame for the loop instead of length because frames is an object, not an array
	for (var i = 0; i < lastFrame; i++){
		var frame = frames[i];
		for (var j = 0; j < losingTeamArr.length; j++){
			var playerIndex = losingTeamArr[j];
			if (frame.players[playerIndex].post.stocksRemaining === 0){
				firstPlayerOut = playerIndex;
			}
		}
		if (firstPlayerOut !== null){
			break;
		}
	}
	return firstPlayerOut;
}

function checkFrameForLosingTeam(playerTeamMapping, frame){
	var losingTeamId = null;
	Object.keys(playerTeamMapping).forEach(function(teamId){
		var teamPlayerIndexes = playerTeamMapping[teamId];
		var firstPlayer = frame.players.filter(function(p){
			return p.pre.playerIndex == teamPlayerIndexes[0];
		})[0];
		var secondPlayer = frame.players.filter(function(p){
			return p.pre.playerIndex == teamPlayerIndexes[1];
		})[0];
		
		if (typeof firstPlayer === 'undefined'){
			if (secondPlayer.post.stocksRemaining === 0){
				losingTeamId = teamId;
			}
		} else if (typeof secondPlayer === 'undefined') {
			if (firstPlayer.post.stocksRemaining === 0){
				losingTeamId = teamId;
			}
		} else if (firstPlayer.post.stocksRemaining === 0 && secondPlayer.post.stocksRemaining > 0){
			losingTeamId = teamId;
		} else if (secondPlayer.post.stocksRemaining === 0 && firstPlayer.post.stocksRemaining > 0){
			losingTeamId = teamId;
		}
	});
	return losingTeamId;
}

function getNewestReplay(){
	var latestModifyDate = null;
	var currFile = null;
	var list = fs.readdirSync(config.slippiReplayFolder);
    list.forEach(function(file){
        stats = fs.statSync(config.slippiReplayFolder + file);
        if (stats.mtime > latestModifyDate || latestModifyDate === null){
        	latestModifyDate = stats.mtime;
        	currFile = file;
        }
    });
	return currFile;
}

function swapPlayers(firstPlayerIndexOut){
	var playerFile = firstPlayerIndexOut + 1;
	var playerFive = readFile(5);
	var playerOut = readFile(playerFile);
	writeFile(5, playerOut);
	writeFile(playerFile, playerFive);
	console.log(`Swapped ${playerOut} for ${playerFive}`);
}

function readFile(player){
	var fileContent = fs.readFileSync(`${config.playerFileFolder}player${player}.txt`);
	return fileContent;
}

function writeFile(playerFile, newText){
	if (typeof newText !== 'undefined' && newText !== null){
		fs.writeFile(`${config.playerFileFolder}player${playerFile}.txt`, newText, function(err){
			if(err) {
				console.log(err);
		    }
		});		
	}
}

function main(){
	var replay;
	if (config.specificReplayName !== null){
		replay = config.specificReplayName;
	} else {
		replay = getNewestReplay();
	}
	if (replay !== null && fileAlreadyProcessed !== replay){
		var firstPlayerIndexOut = findFirstOut(replay);
		if (firstPlayerIndexOut !== null){
			swapPlayers(firstPlayerIndexOut);
			fileAlreadyProcessed = replay;
		}
	}
}

function run() {
	fileAlreadyProcessed = getNewestReplay();
	setInterval(main, 5000);
};

run();