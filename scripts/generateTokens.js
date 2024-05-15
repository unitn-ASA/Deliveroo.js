require('dotenv').config();
const jwt = require('jsonwebtoken');
const { uid } = require('uid/secure');

const SUPER_SECRET = process.env.SUPER_SECRET;

const agents = [];

for (let i = 0; i < 40; i++) {
    const agent = { id: uid(6), name: 'agent'+i, teamId: uid(6), teamName: 'test' };
    const token = jwt.sign( agent, SUPER_SECRET );
    // console.log(token);
    agent.token = token;
    agents.push( agent );
}

console.log( agents.map( a => a.token) );