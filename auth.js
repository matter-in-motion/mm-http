'use strict';
const cookie = require('cookie');

module.exports = opts => (req, res, next) => {
  if (!req.cookies) {
    const cookies = req.headers.cookie;
    req.cookies = cookies ? cookie.parse(cookies) : {};
  }

  opts.provider
    .verify(req.cookies.auth)
    .then(meta => {
      req.meta = meta;
      next();
    })
    .catch(err => {
      if (opts.required) {
        return next(err);
      }
      next();
    });
};
