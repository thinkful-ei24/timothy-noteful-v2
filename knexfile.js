'use strict';

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: 'localhost',
      user: 'dev',
      password: 'snooze11',
      database: 'noteful-app'
    },
    debug: true, // http://knexjs.org/#Installation-debug
    pool: { min: 1, max: 2 }
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL
  },
  test: {
    client: 'pg',
    connection:  {
      host: 'localhost',
      user: 'dev',
      password: 'snooze11',
      database: 'noteful-test'
    }, //process.env.TEST_DATABASE_URL || 'postgres://localhost/noteful-test',
    pool: { min: 1, max: 2 }
  }
};
