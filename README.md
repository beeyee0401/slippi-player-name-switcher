# melee-name-switcher

In Super Smash Bros Melee for the Nintendo Gamecube, this application rotates names of 5 people for a stream overlay. On a stream of playing doubles, the teams will usually be displayed as Player1/Player2 vs Player3/Player4 or something similar. If there's a fifth player waiting in the rotation, they will usually replace the first player out on the losing team. This only applies to 2v2 games

Here's a video to help explain basically what the app does: https://www.youtube.com/watch?v=jFI2JbHEx-8

This application integrates with [Project Slippi](https://github.com/project-slippi/project-slippi)

To install modules:
`npm install`

## Before running

Create a directory with following filenames, each file will just have a player name as its content
- player1.txt
- player2.txt
- player3.txt
- player4.txt
- player5.txt

Create a `config.json` file in the root with the following keys, `specificReplayName` is just to test specific replays, rather than the most recent replay
```
{
	"slippiReplayFolder": "folder\\to\\slippi\\replays\\",
	"playerFileFolder": "folder\\to\\player\\name\\files\\",
	"specificReplayName": null
}
```

To run application: `node app.js`

Now run Slippi and the application will read any new replays.
