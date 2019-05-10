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
			// Get game settings – stage, characters, etc
			var playerTeamMapping = {};
			for (var i = 0; i < settings.players.length; i++){
				if (!(settings.players[i].teamId in playerTeamMapping)){
					playerTeamMapping[settings.players[i].teamId] = [settings.players[i].playerIndex];
				} else {
					playerTeamMapping[settings.players[i].teamId].push(settings.players[i].playerIndex);
				}
			}
			
			firstOutOnLosingTeam = checkFrameForFirstOut(playerTeamMapping, frames[stats.lastFrame]);
			// if this is null, it's because they died very close to the same time
			// but likely still not on the same frame, for some reason I can't just use the last frame always
			if (firstOutOnLosingTeam === null){
				firstOutOnLosingTeam = checkFrameForFirstOut(playerTeamMapping, frames[stats.lastFrame - 1]);
			}
		}
	}
	catch (error) {
		// It errors sometimes in the 3rd party slp parser, so just do nothing and wait for next run
		console.log(error);
	}
	return firstOutOnLosingTeam;
}

function checkFrameForFirstOut(playerTeamMapping, frame){
	var firstOutOnLosingTeam = null;
	Object.keys(playerTeamMapping).forEach(function(key){
		var teamPlayerIndexes = playerTeamMapping[key];
		var firstPlayer = frame.players.filter(function(p){
			return p.pre.playerIndex == teamPlayerIndexes[0];
		})[0];
		var secondPlayer = frame.players.filter(function(p){
			return p.pre.playerIndex == teamPlayerIndexes[1];
		})[0];
		
		if (typeof firstPlayer === 'undefined'){
			if (secondPlayer.post.stocksRemaining === 0){
				firstOutOnLosingTeam = teamPlayerIndexes[0];
			}
		} else if (typeof secondPlayer === 'undefined') {
			if (firstPlayer.post.stocksRemaining === 0){
				firstOutOnLosingTeam = teamPlayerIndexes[1];
			}
		} else if (firstPlayer.post.stocksRemaining === 0 && secondPlayer.post.stocksRemaining > 0){
			firstOutOnLosingTeam = teamPlayerIndexes[0];
		} else if (secondPlayer.post.stocksRemaining === 0 && firstPlayer.post.stocksRemaining > 0){
			firstOutOnLosingTeam = teamPlayerIndexes[1];
		}
	});
	return firstOutOnLosingTeam;
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
}

function readFile(player){
	var fileContent = fs.readFileSync(`${config.playerFileFolder}player${player}.txt`);
	return fileContent;
}

function writeFile(playerFile, newText){
	if (typeof newText !== 'undefined' && newText !== null){
		fs.writeFile(`${config.playerFileFolder}player${playerFile}.txt`, newText, function(err){
			if(err) {
		        return console.log(err);
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