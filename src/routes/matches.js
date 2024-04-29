const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const Arena = require('../deliveroo/Arena');
const Leaderboard = require('../deliveroo/Leaderboard');
const Match = require('../deliveroo/Match');

// Chiave segreta o chiave pubblica per la verifica della firma
const SUPER_SECRET_ADMIN = process.env.SUPER_SECRET_ADMIN || 'default_admin_token_private_key';

// Middleware to check admin token
function verifyToken(req, res, next) {
  
  const token = req.headers.authorization;
  if (!token) {
    return res.status(403).send({ auth: false, message: 'No Token in headers.authorization.' });
  }

  // Check and decode the token
  jwt.verify(token, SUPER_SECRET_ADMIN, (err, decoded) => {
    if ( err || decoded.user != 'admin' || decoded.password != 'god1234' ) {
      return res.status(500).send({ auth: false, message: 'Autenticatione failed.' });
    }
    next();
  });
}

/********************************************* */
/*                    POST                     */
/********************************************* */
// Endpoint for the restart of the match in the room
router.post('/:id', verifyToken, async (req, res) => {
  const roomId = req.params.id;         // get id of the room
  let room = Arena.rooms.get(roomId);   // get the room

  if(!room){
    console.log('PUT room: room', roomId, ' requested not found')
    res.status(400).json({ message: `Room ${roomId} not found` });
    return
  }

  room.match = new Match()
})

// Endpoint to put the match to change it statuts in live on or live off 
router.put('/:id/status', verifyToken, (req, res) => {
  const roomId = req.params.id;         // get id of the room
  let room = Arena.rooms.get(roomId);   // get the room

  if(!room){
    console.log('PUT room: room', roomId, ' requested not found')
    res.status(400).json({ message: `Room ${roomId} not found` });
    return
  }
  
  if(room.match.status == 'on'){room.match.liveOff()}  // if the status of the match is on, the endpoint put it to off
  else{room.match.liveOn()}                            // else if the status is off, the endpoint put it to on
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
// Endpoint to change the match in the room 
router.delete('/:id', verifyToken, async (req, res) => {
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
  
  await room.match.change();
  console.log(`DELETE room: match ${room.match.id} in room ${roomId} deleted.`)

  res.status(200).json({ 
    message: `match ${room.match.id} in room ${roomId} deleted`,
  });
  
});


/********************************************* */
/*                     GET                     */
/********************************************* */
// Endpoint to obtain the list of pass match of a room
router.get('/', async (req, res) => {
  const result = await Leaderboard.getMatches();
 
  res.status(200).json({
    message: 'List active rooms',
    result: result,
  });

});



module.exports = router;
