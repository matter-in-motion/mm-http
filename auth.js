'use strict';
const cookie = require('cookie');

module.exports = opts => (req, res, next) => {
  if (!req.cookies) {
    const cookies = req.headers.cookie;
    req.cookies = cookies ? cookie.parse(cookies) : {};
  }

  opts.provider
    .verify(req.cookies.meta)
    .then(auth => {
      req.body.meta = auth;
      next();
    })
    .catch(err => {
      if (opts.required) {
        return next(err);
      }
      next();
    });
};
