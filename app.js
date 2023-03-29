const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
try {
database = await open({
filename: databasePath,
driver: sqlite3.Database,
});

app.listen(3000, () =>
console.log("Server Running at http://localhost:3000/")
);
} catch (error) {
console.log(`DB Error: ${error.message}`);
process.exit(1);
}
};

initializeDbAndServer();

const convertDbObject = (dbObject) => {
  return {
     playerId: dbObject.player_id,
     playerName: dbObject.player_name,
   };
};


app.get("/players/", async (request, response) => {
const getPlayersQuery = `
SELECT
*
FROM
player_details;`;
const getPlayersQueryResponse = await database.all(getPlayersQuery);
response.send(
getPlayersQueryResponse.map((eachPlayer) =>
convertDbObject(eachPlayer)
)
);
});

app.get("/players/:playerId/", async (request, response) => {
const { playerId } = request.params;
const getPlayerDetailsQuery = `
SELECT
*
FROM
player_details
WHERE
player_id = ${playerId};`;
const getPlayerDetails = await database.get(getPlayerDetailsQuery);
response.send(convertPlayerDbObject(getPlayerDetails));
});

app.put("/players/:playerId/", async (request, response) => {
const { playerId } = request.params;
const { playerName, playerId } = request.body;
const updatePlayerQuery = `
UPDATE
player_details
SET
player_name = '${playerName}',
player_id = ${playerId};`;

await database.run(updatePlayerQuery);
response.send("Player Details Updated");
});

const convertMatchDetailsObject = (dbObject) => {
    return {
        matchId: dbObject.match_id,
        match: dbObject.match,
        year: dbObject.year,
    };
};

app.get("/matches/:matchId/", async (request, response) => {
const { matchId } = request.params;
const getMatchDetailsQuery = `
SELECT
*
FROM
match_details
WHERE
match_id=${matchId};`;
const matchQuery = await database.get(getMatchDetailsQuery);
response.send(convertMatchDetailsObject(matchQuery));
});

app.get("/players/:playerId/matches/", async (request, response) => {
const { playerId } = request.params;
const getMatchesOfPlayerDBQuery = `
SELECT
*
FROM
player_match_score
WHERE
player_id=${playerId};`;
const matchPlayer = await database.all(getMatchesOfPlayerDBQuery);
const matchesIdArr=matchPlayer.map((eachMatch)=>{
    return eachMatch.matchId;
});

const getMatchDetailsQuery=`
SELECT
*
FROM
match_details,
WHERE
match_id=(${matchesIdArr});`;
const fetchMatchDetailsResponse = await database.all(getMatchDetailsQuery);
response.send(fetchMatchDetailsResponse.map((eachMatch)=>
convertMatchDetailsObject(eachMatch)));
});

app.get("/matches/:matchId/players/", async (request, response) => {
const { matchId } = request.params;
const getPlayersOfMatchQuery = `
SELECT
*
FROM
player_match_score
NATURAL JOIN
player_details
WHERE
match_id=${matchId};`;
const playerMatch = await database.all(getPlayersOfMatchQuery);
response.send(playerMatch.map((eachPlayer)=>convertPlayerDbObject(eachPlayer)));
});

const playerStatsObject =(playerName, statsObject)=>{
    return{
        playerId:statsObject.player_id,
        playerName: playerName,
        totalScore: statsObject.totalScore,
        totalFours:statsObject.totalFours,
        totalSixes:statsObject.totalSixes,
    };
};

app.get("/players/:playerId/playerScores", async(request, response)=> {
const{ playerId } =request.params;
const getPlayerNameQuery=`
    SELECT player_name
    FROM player_details
    WHERE player_id=${playerId};`;
const playerNameResponse=await.database.get(getPlayerNameQuery);
const getPlayerStatisticsQuery=`$
SELECT
player_id,
SUM(score) AS totalScore,
SUM(fours) AS totalFours,
SUM(sixes) AS totalSixes,
FROM
player_match_score
WHERE
player_id=${playerId};`;

const playerStatistics=await.database.get(getPlayerStatisticsQuery);
response.send(playerStatsObject(playerNameResponse.player_name,playerStatistics));
      
});

module.exports = app;