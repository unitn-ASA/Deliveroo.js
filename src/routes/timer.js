const express = require('express');
const router = express.Router();
const path = require('path');
const jwt = require('jsonwebtoken');

const Arena = require('../deliveroo/Arena');


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
/*                    PUT                      */
/********************************************* */
// Endpoint for the start of the timer in the room defined by the id
router.put('/:id/start', verifyToken, async (req, res) => {
    const roomId = req.params.id;         // get id of the room
    let room = Arena.rooms.get(roomId);   // get the room

    if(!room){              // check that the room exist
      console.log('PUT timer: room', roomId, ' requested not found')
      res.status(400).json({ message: `Room ${roomId} not found` });
      return
    }

    if(!room.timer){        // check that the room has a timer
      console.log('PUT timer: room', roomId, ' requested not has a timer to stop')
      res.status(400).json({ message: `Timer of room ${roomId} not found` });
      return
    }

    if(room.timer.run){      // check that the timer is not already running 
      console.log('PUT timer: timer in room', roomId, 'is already running')
      res.status(400).json({ message: `Timer of room ${roomId} already running` });
      return
    }

    //after the start of the timer the api switch the grid to unfreeze 
    await room.grid.unfreeze()
    let message = await room.timer.start(req.body.time);  //start the timer, save the status of the start action and send it to the client 
  
    console.log('PUT timer: start timer with time:', req.body.time)
    
    res.status(200).json({ 
      message: message,
      matchId: room.match.id
    });
})

// Endpoint for the stop of the timer in the room defined by the id
router.put('/:id/stop', verifyToken, async (req, res) => {
  const roomId = req.params.id;         // get id of the room
  let room = Arena.rooms.get(roomId);   // get the room

  if(!room){                // check that the room exist
    console.log('PUT timer: room', roomId, ' requested not found')
    res.status(400).json({ message: `Room ${roomId} not found` });
    return
  }

  if(!room.timer){           // check that the room has a timer
    console.log('PUT timer: room', roomId, ' requested not has a timer to stop')
    res.status(400).json({ message: `Timer of room ${roomId} not found` });
    return
  }

  if(!room.timer.run){      // check that the timer is not already waiting 
    console.log('PUT timer: timer in room', roomId, 'is already running')
    res.status(400).json({ message: `Timer of room ${roomId} already running` });
    return
  }

  console.log('PUT timer: stop timer at tiem', room.timer.remainingTime)
  let message = await room.timer.stop()

  //after the stop of the timer the api switch the grid to freeze 
  await room.grid.freeze()

  res.status(200).json({ 
    message: message,
    matchId: room.match.id
  });

})


module.exports = router;
