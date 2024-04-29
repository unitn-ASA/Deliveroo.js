const express = require('express');
const router = express.Router();
const path = require('path');
const jwt = require('jsonwebtoken');

const Arena = require('../deliveroo/Arena');

// Chiave segreta o chiave pubblica per la verifica della firma
const SUPER_SECRET_ADMIN = process.env.SUPER_SECRET_ADMIN || 'default_admin_token_private_key';

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
// Endpoint for change the grid in the room
router.put('/:id', verifyToken, async (req, res) => {
    const roomId = req.params.id;         // get id of the room
    let room = Arena.rooms.get(roomId);   // get the room
  
    if(!room){
      console.log('PUT room: room', roomId, ' requested not found')
      res.status(400).json({ message: `Room ${roomId} not found` });
      return
    }
  
    await room.changeGrid(req.body) 

    res.status(200).json({ 
      message: `Grid of the room ${roomId} changed.`,
    });

  })

// Endpoint to change the grid statuts in freeze or unfreeze
router.put('/:id/status', verifyToken, async (req, res) => {
    const roomId = req.params.id;         // get id of the room
    let room = Arena.rooms.get(roomId);   // get the room
  
    if(!room){
      console.log('PUT room: room', roomId, ' requested not found')
      res.status(400).json({ message: `Room ${roomId} not found` });
      return
    }
    
    //console.log(`PUT room: receveid request when the grid is ${room.grid.status}.`)
    if(room.grid.status == 'freeze'){await room.grid.unfreeze()}  // if the status of the match is on, the endpoint put it to off
    else{await room.grid.freeze()}                            // else if the status is off, the endpoint put it to on
    console.log(`PUT room: status of grid in room ${roomId} update to ${room.grid.status}.`)
  
    res.status(200).json({ 
      message: `Status of the grid in room ${roomId} update into ${room.grid.status}.`,
      status: room.grid.status
    });
})


/********************************************* */
/*                    GET                      */
/********************************************* */
// Endpoint to obtain the list of all the agents on the grid
router.get('/:id/agents', verifyToken, async (req, res) => {
    const roomId = req.params.id;
    let room = Arena.rooms.get(roomId);
  
    if(!room){
      console.log('GET agents list: room', roomId, 'requested not found')
      res.status(400).json({ message: `Room ${roomId} not found` });
      return
    }
    
    let agentsName =  Array.from(await room.grid.getAgents()).map(agent => agent.name)
    let agentsId = Array.from(await room.grid.getAgents()).map(agent => agent.id)
    //console.log(`GET agents list: request sucsessfull.`, agentsName, agentsId  )
  
    res.status(200).json({ 
      message: `request sucsessfull`,
      agentsName: agentsName,
      agentsId: agentsId
    });
    
  });
  
module.exports = router;
  