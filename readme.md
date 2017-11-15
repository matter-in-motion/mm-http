# Matter In Motion. HTTP transport

[![NPM Version](https://img.shields.io/npm/v/mm-http.svg?style=flat-square)](https://www.npmjs.com/package/mm-http)
[![NPM Downloads](https://img.shields.io/npm/dt/mm-http.svg?style=flat-square)](https://www.npmjs.com/package/mm-http)

Http transport extension for [matter in motion](https://github.com/matter-in-motion/mm) framework

## Usage

[Transport installation instructions](https://github.com/matter-in-motion/mm/blob/master/docs/transports.md)

_Http transport adds `root` property to the `app`. It is just an `express` instance. Also, you can use `app.use` method to add a contract or any other express-compatible handler_

### Protocol

To use all advantages of HTTP protocol:

* __GET__
  1. Add `call` in the URL after API URL
  2. Add `body` as query string
* __POST__
  1. Add special `MM` header with call as JSON string
  2. Send `body` as string, number, boolean, or JSON string in request body

Put meta field in the standard `Authorization: Bearer` header.

**HTTP request requires `Accept` and `Content-Type` headers to be set to `application/json`**

The response will come as JSON string.

From the browser looks like this:

#### `GET` request:

```js
const xhr = new XMLHttpRequest();
xhr.open('GET', '/api/world.hello?name=John', true);
xhr.setRequestHeader('Authorization', 'Bearer ' + meta);
xhr.setRequestHeader('Accept', 'application/json');
xhr.send();
xhr.onload = function() {
  if (xhr.status === 200) {
    let msg = JSON.parse(xhr.responseText);
    console.log(msg);
  } else {
    console.log(xhr.status);
  }
}

```

#### `POST` request:

```js
const xhr = new XMLHttpRequest();
xhr.open('POST', '/api', true);
xhr.setRequestHeader('MM', JSON.stringify({ call: 'world.hello' }) );
xhr.setRequestHeader('Authorization', 'Bearer ' + token);
xhr.setRequestHeader('Accept', 'application/json');
xhr.setRequestHeader('Content-Type', 'application/json');
xhr.send(body);
xhr.onload = function() {
  if (xhr.status === 200) {
    let msg = JSON.parse(xhr.responseText);
    console.log(msg);
  } else {
    console.log(xhr.status);
  }
}

```

If you make `POST` request with content type set to `multipart/*` message will be marked as raw and request object will be passed into your API call method, so you can parse it any way you want.

#### `OPTIONS` request

This is similar to the `POST` but it will transform into **question request** and body will be ignored

## Settings

Only `port` option is required. Everything else is optional.

* __port__ — number. Accepting connections on the specified port
* __host__ — string, '0.0.0.0'. Accepting connections on the specified hostname.
* __limit__ — number, null. Limit content length for the api request
* __encoding__ — string, 'utf8'. Encoding of the api request
* __cors__ — defines the cross-origin HTTP request control. Every option adds corresponding http headers for preflight `OPTIONS` request and for actual request
  - __allowOrigin__ — Recomended for the matter in motion protocol: '*',
  - __allowMethods__ — Recomended for the matter in motion protocol: 'GET, POST, OPTIONS',
  - __allowHeaders__ — Recomended for the matter in motion protocol: 'Authorization, Origin, Content-Type, Accept, MM',
  - __maxAge__ — Recomended for the matter in motion protocol: 1728000
* __tls__ — instead of http server will create https server, this should be the [https server settings](https://nodejs.org/api/https.html#https_https_createserver_options_requestlistener)
* __static__ — adds `express.static` static files handler. For more info look into [official documentation](https://expressjs.com/en/4x/api.html#express.static)
  - __url__ — string, static url path
  - __root__ — string, root directory from which the static assets are to be served
  - __dotfiles__ — string, 'ignore'. Option for serving dotfiles. Possible values are “allow”, “deny”, and “ignore”
  - __etag__ — boolean, true. Enable or disable etag generation
  - __extensions__ — Sets file extension fallbacks: If a file is not found, search for files with the specified extensions and serve the first one found. Example: ['html', 'htm'].
  - __index__ — string, 'index.html'. Sends the specified directory index file. Set to false to disable directory indexing.
  - __lastModified__ — boolean, true. Set the Last-Modified header to the last modified date of the file on the OS.
  - __maxAge__ — number, 0. Set the max-age property of the Cache-Control header in milliseconds or a string in ms format
  - __redirect__ — boolean, true. Redirect to trailing “/” when the pathname is a directory.
  - __setHeaders__ — function for setting HTTP headers to serve with the file.

## Contract

The contract is a subclass of the express Router class that makes easy to add unit views.

To use as sub contract define `handle` method as express-like middleware

### addView(path, view)

* __path__ — path to add view to
* __view__ — name of the view unit

### addViews(obj)

Adds all views from `obj`:
```js
this.addViews({
  '/?': 'index',
  '/contacts/?': 'contacts',
})
```


License: MIT

© velocityzen
