'use strict';

const express = require('express');

// Create an router instance (aka "mini-app")
const router = express.Router();

// TEMP: Simple In-Memory Database
//const data = require('../db/notes');
//const simDB = require('../db/simDB');
//const notes = simDB.initialize(data);
const knex = require('../knex');


// Get All (and search by query)
router.get('/', (req, res, next) => {
  const { searchTerm } = req.query;

  knex.select('id', 'title', 'content')
  .from('notes')
  .modify(function (queryBuilder) {
    if (searchTerm) {
      queryBuilder.where('title', 'like', `%${searchTerm}%`);
    }
  })
  .orderBy('notes.id')
  .then(results => {
    res.json(results);
  })
  .catch(err => {
    next(err);
  });
});

// Get a single item
router.get('/:id', (req, res, next) => {
  const id = req.params.id;

  knex
  .select()
  .from('notes')
  .where({id: id})
  .returning(['id', 'title', 'content'])
  .then(result => {
    if(result[0]) {
      res.json(result[0]);
    }
    else {
      next();
    }
  });
});

// Put update an item
router.put('/:id', (req, res, next) => {
  const id = req.params.id;

  /***** Never trust users - validate input *****/
  const updateObj = {};
  const updateableFields = ['title', 'content'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      updateObj[field] = req.body[field];
    }
  });

  /***** Never trust users - validate input *****/
  if (!updateObj.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  knex('notes')
  .update(updateObj)
  .where({id: id})
  .returning(['id', 'title', 'content'])
  .then(item => {
    if(item[0]) res.json(item[0]);
    else next();
  });


});

// Post (insert) an item
router.post('/', (req, res, next) => {
  const { title, content } = req.body;

  const newItem = { title, content };
  /***** Never trust users - validate input *****/
  if (!newItem.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  knex('notes')
  .insert(newItem)
  .returning(['id', 'title', 'content'])
  .then(item => {
    if(item[0]) res.location(`http://${req.headers.host}/notes/${item.id}`).status(201).json(item);
  });

});

// Delete an item
router.delete('/:id', (req, res, next) => {
  const id = req.params.id;

  knex('notes')
  .where('id', id)
  .del()
  .then(() => {
    res.sendStatus(204)
  });

});


module.exports = router;