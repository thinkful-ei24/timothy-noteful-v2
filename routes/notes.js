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
  const { searchTerm, folderId } = req.query;

  knex('notes')
  .select('notes.id', 'title', 'content', 'folders.id as folderId', 'folders.name as folderName')
  .leftJoin('folders', 'notes.folder_id', 'folders.id')
  .modify(function (queryBuilder) {
    if (searchTerm) {
      queryBuilder.where('title', 'like', `%${searchTerm}%`);
    }
  })
  .modify(function (queryBuilder) {
    if (folderId) {
      queryBuilder.where('folder_id', folderId);
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
  const noteId = req.params.id;

  knex
  .select('notes.id', 'title', 'content', 'folders.id as folderId', 'folders.name as folderName')
  .from('notes')
  .leftJoin('folders', 'notes.folder_id', 'folders.id')
  .where({'notes.id': noteId})
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

  let noteId;
  knex('notes')
  .update(updateObj)
  .where({id: id})
  .returning('id')
  .then(([id]) => {
    noteId = id;

    return knex
      .select('notes.id', 'title', 'content', 'folder_id as folderId', 'folders.name as folderName')
      .from('notes')
      .leftJoin('folders', 'notes.folder_id', 'folder.id')
      .where('notes.id', noteId)   
  })
    .then(results => {
      const result = results[0];
      if(result) res.json(result);
      else next();
    });
  /*
  .then(item => {
    if(item[0]) res.json(item[0]);
    else next();
  });
*/

});

// Post (insert) an item
router.post('/', (req, res, next) => {
  const { title, content, folderId } = req.body;

  const newItem = { title, content, folder_id: folderId };
  /***** Never trust users - validate input *****/
  if (!newItem.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }
  let noteId; 
  knex('notes')
  .insert(newItem)
  .returning('id')
  .then(([id]) => {
    noteId = id;
    return knex
      .select('notes.id', 'title', 'content', 'folder_id as folderId', 'folders.name as folderName')
      .from('notes')
      .leftJoin('folders', 'notes.folder_id', 'folders.id')
      .where('notes.id', noteId);
  })
    .then(item => {
      if(item[0]) res.location(`http://${req.headers.host}/notes/${item.id}`).status(201).json(item[0]);
  });

});

// Delete an item
router.delete('/:id', (req, res, next) => {
  const id = req.params.id;

  knex('notes')
  .where('id', id)
  .del()
  .then(() => {
    res.sendStatus(204);
  });

});


module.exports = router;