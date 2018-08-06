'use strict';
const test = require('ava');
const { createApp, createClient } = require('mm-test');
const got = require('got');
const extension = require('./index');
const httpMethodsTestApi = require('./http-test');

process.env.NODE_ENV = '';
const API_URL = 'http://localhost:3000/api';
const request = ({ method, path, body }) => got(`${API_URL}/${path}`, {
  method,
  json: true,
  body
}).then(res => {
  const msg = res.body;
  if (msg[0]) {
    throw msg[0];
  }

  return msg[1];
});

const app = createApp({
  extensions: [
    extension,
    'serializer-json',
    httpMethodsTestApi
  ],

  serialiser: {
    default: 'json'
  }
}, { default: false });

const mm = createClient({ host: 'localhost:3000' })

test('checks the app', t => {
  t.true(app.inited);
  t.truthy(app.root);
});


test('check call request', t => mm('test.GET', { hello: 'world' })
  .then(res => {
    t.is(res.hello, 'world');
  })
);

test('check http get request', t => request({
  method: 'GET',
  path: 'test'
}).then(res => {
  // should be empty
  t.falsy(res);
}));

test('check http get request with vars', t => request({
  method: 'GET',
  path: 'test?a=test'
}).then(res => {
  t.is(res.a, 'test');
}));

test('check http post request with vars', t => request({
  method: 'POST',
  path: 'test',
  body: {
    a: 'test'
  }
}).then(res => {
  t.is(res.a, 'test');
}));

test('check http put request with vars', t => request({
  method: 'PUT',
  path: 'test',
  body: {
    a: 'test'
  }
}).then(res => {
  t.is(res.a, 'test');
}));


test('check http delete request with vars', t => request({
  method: 'DELETE',
  path: 'test',
  body: {
    a: 'test'
  }
}).then(res => {
  t.is(res.a, 'test');
}));

test('check http option request', t => request({
  method: 'OPTIONS',
  path: 'test'
}).then(res => {
  t.is(res[0], 'GET');
  t.is(res[1], 'POST');
  t.is(res[2], 'PUT');
  t.is(res[3], 'DELETE');
}));
