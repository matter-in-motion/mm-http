'use strict';
const http = require('http');
const https = require('https');
const express = require('express');
const getRawBody = require('raw-body');
const errors = require('mm-errors');

const rxForms = /^multipart\/(?:form-data|related)(?:;|$)/i;

const Transport = function(opts) {
  this.root = express();
  this.root.disable('x-powered-by');

  this.connect = opts.connect;
  this.message = opts.message;
  this.error = opts.error;
  this.close = opts.close;
};

Transport.prototype.__initRequired = true;

Transport.prototype.__init = function(units) {
  this.root.set('env', process.env.NODE_ENV);
  const coreSettings = units.require('core.settings').core;
  const settings = coreSettings.transports.http;
  this.limit = settings.limit || null;
  this.encoding = settings.encoding || 'utf8';
  this.defaultType = settings.type || 'application/json';
  this.cors = settings.cors;
  this.port = settings.port;
  this.host = settings.host;
  this.backlog = settings.backlog;
  settings.static && this.static(settings.static);

  this.root.use(coreSettings.api, (req, res) => this.request(req, res));

  if (settings.tls) {
    this.server = https.createServer(settings.tls, this.root);
  } else {
    this.server = http.createServer(this.root);
  }
};

Transport.prototype.start = function() {
  this.server.listen(this.port, this.host, this.backlog);
};

Transport.prototype.static = function(opts) {
  this.root.use(opts.url, express.static(opts.root, opts));
  return this;
};

Transport.prototype.request = function(req, res) {
  this.connect(req);

  let msg;
  try {
    let mm = req.get('MM');
    msg = JSON.parse(mm);
  } catch (e) {
    msg = {}
  }

  const type = req.get('Accept');
  msg.type = type && type !== '*/*' ? type : this.defaultType;
  msg.httpRequest = req;
  msg.connection = res;

  if (msg.type === 'application/json') {
    msg.objectMode = true;
  }

  const meta = req.get('Authorization');
  if (meta) {
    msg.meta = meta.split(' ')[1];
  }

  if (req.method === 'OPTIONS') {
    msg.call = msg.call ? msg.call + '?' : '?';
    return this.message(msg);
  }

  if (req.method === 'GET') {
    msg.call = req.path.substr(1);
    msg.request = req.query || null;
    return this.message(msg);
  }

  //other methods
  //first check in case there are files
  if (rxForms.test(req.get('Content-Type'))) {
    //parse data part in your controller
    //to get raw req object as data use raw  option in your schema
    msg.raw = true;
    return this.message(msg);
  }

  getRawBody(req, {
    length: req.get('Content-Length'),
    limit: this.limit,
    encoding: this.encoding
  }, (err, string) => {
    if (err) {
      msg.error = err.status === 413 ? errors.RequestTooLarge() : err;
    } else {
      msg.request = string;
    }

    this.message(msg);
  });
};

Transport.prototype.response = function(msg) {
  const response = msg.connection;

  response
    .status(200)
    .type(msg.type);

  if (this.cors) {
    response.set('Access-Control-Allow-Origin', this.cors.allowOrigin);
    if (msg.httpRequest.method === 'OPTIONS') {
      response.set({
        'Access-Control-Allow-Methods': this.cors.allowMethods,
        'Access-Control-Allow-Headers': this.cors.allowHeaders,
        'Access-Control-Max-Age': this.cors.maxAge
      });
    }
  }

  response.send(msg.response);
};

module.exports = Transport;
