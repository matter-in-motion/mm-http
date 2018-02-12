'use strict';
const http = require('http');
const https = require('https');
const express = require('express');
const getRawBody = require('raw-body');
const errors = require('mm-errors');

const rxForms = /^multipart\/(?:form-data|related)(?:;|$)/i;

const Http = function() {
  this.server = undefined;
  this.root = express();
  this.root.disable('x-powered-by');
};

Http.prototype.__initRequired = true;

Http.prototype.__init = function(units) {
  this.root.set('env', process.env.NODE_ENV);
  const settings = units.require('core.settings');
  const httpSettings = settings.http;

  this.limit = httpSettings.limit || null;
  this.encoding = httpSettings.encoding || 'utf8';
  this.defaultType = httpSettings.type || 'application/json';
  this.cors = httpSettings.cors;
  this.port = httpSettings.port;
  this.host = httpSettings.host;
  this.backlog = httpSettings.backlog;
  httpSettings.static && this.static(httpSettings.static);

  this.root.use(settings.core.api, (req, res) => this.request(req, res));

  if (httpSettings.tls) {
    this.server = https.createServer(httpSettings.tls, this.root);
  } else {
    this.server = http.createServer(this.root);
  }
};

Http.prototype.start = function() {
  this.server.listen(this.port, this.host, this.backlog);
};

Http.prototype.static = function(opts) {
  this.root.use(opts.url, express.static(opts.root, opts));
  return this;
};

Http.prototype.request = function(req, res) {
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

Http.prototype.response = function(msg) {
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

module.exports = Http;
