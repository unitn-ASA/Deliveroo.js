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
        config: newRoom.match.config,
        map: map
      });
    })
    .catch(error => {
      console.error('POST room: error in the reading of the map file:', error);
      res.status(500).json({ error: 'Error in the reading of the map file:' });
    });

});

 

/********************************************* */
/*                    PUT                      */
/********************************************* */
// Endpoint for the restart of the match in the room
router.put('/:id/match', verifyToken, async (req, res) => {

  const roomId = req.params.id;         // get id of the room
  let room = Arena.rooms.get(roomId);

  if(!room){
    console.log('PUT room: room', roomId, ' requested not found')
    res.status(400).json({ message: `Room ${roomId} not found` });
    return
  }

  //check if the room has already a non ended match, in the case terminate it
  if(room.match.status != 'end'){
    console.log('PUT room: ending the already existing match ', room.match.id)
    await room.match.destroy();
  }
  
  var config = new Config( req.body );
  let newMatch = new Match({roomId: roomId, config: config})
  room.match = newMatch
  console.log("PUT room: creation of the new Match: ")

  let mapPath = mapsDirectory + '/' + config.MAP_FILE +'.json';

  fs.promises.readFile(mapPath, 'utf8')
    .then(data => {
      const dataJson = JSON.parse(data);
      const map = dataJson.map;

      res.status(200).json({
        message: 'Data received successfully',
        id: newMatch.id,
        config: newMatch.config,
        map: map
      });
    })
    .catch(error => {
      console.error('PUT room: error in the reading of the map file:', error);
      res.status(500).json({ error: 'Error in the reading of the map file:' });
    });

});

router.put('/:id/match/status', verifyToken, (req, res) => {
  const roomId = req.params.id;      // get id of the match
  let room = Arena.rooms.get(roomId);

  if(!room){
    console.log('PUT room: room', roomId, ' requested not found')
    res.status(400).json({ message: `Room ${roomId} not found` });
    return
  }

  if(room.match.status == 'end'){
    console.log('PUT room: match in room ', roomId, ' is already ended, request invalid ')
    res.status(400).json({ message: `Match in room ${roomId} already ended` });
    return
  }
  
  room.match.startStopGame();
  console.log(`PUT room: status of match in room ${roomId} update to ${room.match.status}.`)

  res.status(200).json({ 
    message: `Stato del match in room ${roomId} aggiornato a ${room.match.status}.`,
    matchId: room.match.id,
    status: room.match.status
  });
});


/********************************************* */
/*                   DELETE                    */
/********************************************* */
// Endpoint per eliminare un gioco
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

router.delete('/:id/match', verifyToken, async (req, res) => {
  const roomId = req.params.id;
  let room = Arena.rooms.get(roomId);

  if(!room){
    console.log('DELETE room: room', roomId, 'requested not found')
    res.status(400).json({ message: `Room ${roomId} not found` });
    return
  }

  if(room.match.status == 'end'){
    console.log('DELETE room: match in room ', roomId, ' is already ended, request invalid ')
    res.status(400).json({ message: `Match in room ${roomId} already ended` });
    return
  }
  
  await room.match.destroy();
  console.log(`DELETE room: match ${room.match.id} in room ${roomId} deleted.`)

  res.status(200).json({ 
    message: `match ${room.match.id} in room ${roomId} deleted`,
  });
  
  
});


/********************************************* */
/*                     GET                     */
/********************************************* */
// Endpoint per ottenere la lista dei rooms
router.get('/', async (req, res) => {
  const rooms = Array.from(Arena.rooms.keys());
  const matches = Array.from(Arena.rooms.values()).map(room => room.match.id);
  const status = Array.from(Arena.rooms.values()).map(room => room.match.status);

  // get all the promise for request the dates, then we wait that all the promise are resolved 
  const datesPromises = Array.from(Arena.rooms.values()).map(room => Leaderboard.getMatcheFirst(room.match.id));       
  const dates = await Promise.all(datesPromises);

  res.status(200).json({
    message: 'List active rooms',
    rooms: rooms,
    matches: matches,
    status: status,
    dates: dates
  });
});

// Endpoint per ottenere la lista dei matchs di una rooms
router.get('/:id/matches', async (req, res) => {
  const result = await Leaderboard.getMatches(req.params.id);
 
  res.status(200).json({
    message: 'List active rooms',
    result: result,
  });

});


// Endpoint per ottenere lo stato del match del room
router.get('/:id/status', (req, res) => {
  const roomId = req.params.id;
  const room = Arena.getRoom(roomId);
  let status
   
  if(room){
    //console.log(match, match.status);
    status = room.match.status
  }else{
    //console.log('Match ', matchId + ' not find')
    res.status(400).send('Room not find')
    return
  }
 
  res.status(200).json({
    matchId: room.match.id,
    status: status
  });
});


module.exports = router;
