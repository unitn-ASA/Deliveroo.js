#!/usr/bin/env node

process.env.MAP ||= process.argv[2];

process.env.PARCELS_GENERATOR ||= process.argv[3];

const index = require('./index.js');

