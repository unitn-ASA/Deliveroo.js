const express = require('express');
const router = express.Router();
const Config = require('../deliveroo/Config');
const Arena = require('../deliveroo/Arena');

// ask for the config 
router.get('/', async (req, res) => {

    let config;

    // if the reques headers has the header roomId, the api return the config of it last match; else it return the default config
    let roomId = req.headers['roomid']
    if(roomId){
        let room = Arena.getRoom(roomId);
        
        // check if the room requeste exist 
        if(!room){
            console.log('GET config: room', roomId, ' requested not found')
            res.status(400).json({ message: `Room ${roomId} not found` });
            return
        }

        config = await room.grid.config;
    }else{
        config = await new Config()
    }
    
    console.log('GET config: room', roomId,)
    res.status(200).json(config); 
})

module.exports = router;
