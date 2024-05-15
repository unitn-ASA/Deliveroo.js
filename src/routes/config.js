const express = require('express');
const router = express.Router();
const Config = require('../deliveroo/Config');

// GET /config/default 
router.get('/default', async (req, res) => {
    
    console.log(`GET /config/default`)
    res.status(200).json( new Config() );

})

module.exports = router;
