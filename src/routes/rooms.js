const express = require('express');
const router = express.Router();
const path = require('path');
const jwt = require('jsonwebtoken');

const Arena = require('../deliveroo/Arena');
const Config = require('../deliveroo/Config');
const Leaderboard = require('../deliveroo/Leaderboard');
const Match = require('../deliveroo/Match');
const fs = require('fs');


// Chiave segreta o chiave pubblica per la verifica della firma
const SUPER_SECRET_ADMIN = process.env.SUPER_SECRET_ADMIN || 'default_admin_token_private_key';

// Directory that contain maps file
const mapsDirectory = path.join(__dirname, '..','..','levels','maps')

// Middleware to check admin token
function verifyToken(req, res, next) {
  
  const token = req.headers.authorization;
  if (!token) {
    return res.status(403).send({ auth: false, message: 'Token not find.' });
  }

  // Check and decode the token
  jwt.verify(token, SUPER_SECRET_ADMIN, (err, decoded) => {
    if (err) {
      return res.status(500).send({ auth: false, message: 'Autenticatione feiled.' });
    }

    if(decoded.user != 'admin' || decoded.password != 'god1234'){
      return res.status(500).send({ auth: false, message: 'Autenticatione feiled.' });
    }

    next();
  });
}

/********************************************* */
/*                    POST                     */
/********************************************* */
// Endpoint for the cration of a new Room with a start match
router.post('/', verifyToken, async (req, res) => {
  
  var config = new Config( req.body );
  var newRoom = Arena.createRoom(config);
  console.log("POST room: creation of the new Room: ", newRoom.id)

  let mapPath = mapsDirectory + '/' + config.MAP_FILE +'.json';

  fs.promises.readFile(mapPath, 'utf8')
    .then(data => {
      const dataJson = JSON.parse(data);
      const map = dataJson.map;

      res.status(200).json({
        message: 'Data received successfully',
        id: newRoom.id,
      });
    })
    .catch(error => {
      console.error('POST room: error in the reading of the map file:', error);
      res.status(500).json({ error: 'Error in the reading of the map file:' });
    });

});



/********************************************* */
/*                   DELETE                    */
/********************************************* */
// Endpoint t delete the room
router.delete('/:id', verifyToken, async (req, res) => {
  const roomId = req.params.id;
  
  if( await Arena.deleteRoom(roomId) ){
    console.log("DELETE room: ", roomId, " deleted")
    res.status(200).json({
      message: 'Room deleted sucsessfully!',
      id: roomId
    });
  }else{
    console.log("DELETE room: error, room: ", roomId, " not found")
    res.status(500).json({ message: 'Error during the elimination of the room' });
  }
  
  
});


/********************************************* */
/*                     GET                     */
/********************************************* */
// Endpoint to obtain the list of all the room
router.get('/', async (req, res) => {
  /* for each room we send: the id of the actual match, the status of the match (on or off), the status of the grid (freeze or unfreeze),
  the flag run of the timer and the date of the match*/
  const rooms = Array.from(Arena.rooms.keys());
  const matchesId = Array.from(Arena.rooms.values()).map(room => room.match.id);
  const matchesStatus = Array.from(Arena.rooms.values()).map(room => room.match.status);
  const gridStatus = Array.from(Arena.rooms.values()).map(room => room.grid.status);
  const timerStatus = Array.from(Arena.rooms.values()).map(room => room.timer.run);

  // get all the promise for request the dates, then we wait that all the promise are resolved 
  const datesPromises = Array.from(Arena.rooms.values()).map(room => Leaderboard.getMatcheFirst(room.match.id));       
  const matchesDates = await Promise.all(datesPromises);

  res.status(200).json({
    message: 'List active rooms',
    rooms: rooms,
    matchesId: matchesId,
    matchesStatus: matchesStatus,
    matchesDates: matchesDates,
    gridStatus: gridStatus,
    timerStatus: timerStatus
  });
});
// Endpoint to obtain the state info of the room
router.get('/:id', (req, res) => {
  const roomId = req.params.id;
  const room = Arena.getRoom(roomId);
  let matchStatus; let matchId; let gridStatus; let timerStatus; let remainingTime
   
  if(room){ 
    matchStatus = room.match.status 
    matchId = room.match.id
    gridStatus = room.grid.status
    timerStatus = room.timer.run
    remainingTime = room.timer.remainingTime
  }
  else{
    //console.log('Match ', matchId + ' not find')
    res.status(400).send('Room not find')
    return
  }
 
  res.status(200).json({
    matchId: matchId,
    matchStatus: matchStatus,
    gridStatus: gridStatus,
    timerStatus: timerStatus,
    remainingTime: remainingTime
  });
});



module.exports = router;
