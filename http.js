'use strict';
const http = require('http');
const https = require('https');
const express = require('express');
const getRawBody = require('raw-body');
const errors = require('mm-errors');

const rxForms = /^multipart\/(?:form-data|related)(?:;|$)/i;

const getRequest = request => {
  if (!Object.keys(request).length) {
    return null;
  }

  return request;
}

// use function will be added as the app use method
const use = function(path, contract) {
  if (!contract) {
    contract = path;
    path = '/';
  }

  if (contract.handle) {
    this.root.use(path, (req, res, next) => {
      contract.handle(req, res, next)
    });
  } else {
    this.root.use(path, contract);
  }
  return this;
}

const Http = function() {
  this.server = undefined;
  this.root = express();
  this.root.disable('x-powered-by');
};

Http.prototype.__initRequired = true;

Http.prototype.__init = function(units) {
  this.root.set('env', process.env.NODE_ENV);
  const settings = units.require('core.settings');

  const serializer = settings.http && settings.http.serializer ? settings.http.serializer : settings.serializers.default;
  if (serializer) {
    this.defaultSerializer = units.require(`serializers.${serializer}`);
  }

  this.root.use(settings.core.api.path, (req, res) => this.request(req, res));
  this.init(settings.http);
  this.addHelpers(units.require('core.app'));
};

Http.prototype.init = function(settings = {}) {
  this.limit = settings.limit || null;
  this.encoding = settings.encoding || 'utf8';
  this.cors = settings.cors;
  this.port = settings.port || 3000;
  this.host = settings.host || '0.0.0.0';
  this.backlog = settings.backlog;
  settings.static && this.static(settings.static);

  if (settings.tls) {
    this.server = https.createServer(settings.tls, this.root);
  } else {
    this.server = http.createServer(this.root);
  }
};

Http.prototype.addHelpers = function(app) {
  app.root = this.root;
  app.use = use;
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

  const msg = this.parseCall(req);

  const mime = req.get('Accept');
  msg.mime = mime && mime !== '*/*' ? mime : this.defaultSerializer.mime;
  msg.original = req;
  msg.connection = res;

  const meta = req.get('Authorization');
  if (meta) {
    msg.meta = meta.split(' ')[1];
  }


  if (req.method === 'OPTIONS') {
    msg.call = msg.call ? msg.call + '?' : '?';
    return this.message(msg);
  }

  if (req.method === 'GET') {
    msg.request = getRequest(req.query);
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

  this.parseRequest(msg, req);
};

Http.prototype.parseCall = function(req) {
  let msg;
  try {
    let mm = req.get('MM');
    msg = JSON.parse(mm);
  } catch (e) {
    msg = {}
  }

  if (msg.call) {
    return msg;
  }

  const pathParts = req.path.split('/');
  const call = pathParts[1];

  if (call.includes('.') || req.method === 'OPTIONS') {
    msg.call = call;
  } else {
    msg.call = `${call}.${req.method}`;
  }
  return msg;
};

Http.prototype.parseRequest = function(msg, req) {
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
    .type(msg.mime);

/*  if (this.cors) {
    response.set('Access-Control-Allow-Origin', this.cors.allowOrigin);
    if (msg.original.method === 'OPTIONS') {
      response.set({
        'Access-Control-Allow-Methods': this.cors.allowMethods,
        'Access-Control-Allow-Headers': this.cors.allowHeaders,
        'Access-Control-Max-Age': this.cors.maxAge
      });
    }
  }*/

  response.send(msg.response);
};

module.exports = Http;
