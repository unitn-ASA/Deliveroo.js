const express = require('express');
const router = express.Router();
const Config = require('../deliveroo/Config');

// ask for the default config 
router.get('/', async (req, res) => {
    let defaultConfig = new Config()
    //console.log(defaultConfig)
    res.status(200).json(defaultConfig); 
})

module.exports = router;
