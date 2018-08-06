'use strict';

module.exports = {
  __expose: true,

  GET: function() {
    return {
      title: 'Test',
      description: 'returns the get request data',
      request: {},
      response: {},
      call: (auth, data) => data
    }
  },

  POST: function() {
    return {
      title: 'Test',
      description: 'returns the post request data',
      request: {},
      response: {},
      call: (auth, data) => data
    }
  },

  PUT: function() {
    return {
      title: 'Test',
      description: 'returns the put request data',
      request: {},
      response: {},
      call: (auth, data) => data
    }
  },

  DELETE: function() {
    return {
      title: 'Test',
      description: 'returns the delete request data',
      request: {},
      response: {},
      call: (auth, data) => data
    }
  }
};
