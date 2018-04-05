'use strict';
const test = require('ava');
const { createApp } = require('mm-test');
const extension = require('./index');

process.env.NODE_ENV = '';

const app = createApp({
  extensions: [
    extension,
    'serializer-json'
  ],

  serialiser: {
    default: 'json'
  }
}, { default: false });


test('checks the app', t => {
  t.true(app.inited);
  t.truthy(app.root);
});
