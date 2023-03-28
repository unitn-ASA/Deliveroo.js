'use strict';

const helloWorld = require('..');
const assert = require('assert').strict;

assert.strictEqual(helloWorld(), 'Hello from helloWorld');
console.info('helloWorld tests passed');
