'use strict';

const express = require('express');

// Create an router instance (aka "mini-app")
const router = express.Router();

// TEMP: Simple In-Memory Database
//const data = require('../db/notes');
//const simDB = require('../db/simDB');
//const notes = simDB.initialize(data);
const knex = require('../knex');
const hydrateNotes = require('../utils/hydrateNotes');

// Get All (and search by query)
router.get('/', (req, res, next) => {
  const { searchTerm, folderId, tagId } = req.query;

  knex('notes')
  .select('notes.id', 'title', 'content', 'folders.id as folderId', 'folders.name as folderName', 'tags.name as tagName', 'tags.id as tagId')
  .leftJoin('folders', 'notes.folder_id', 'folders.id')
  .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
  .leftJoin('tags', 'notes_tags.tag_id', 'tags.id')
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
  .modify(function (queryBuilder){
    if(tagId) {
      queryBuilder.where('tags.id', tagId)
    }
  })
  .orderBy('notes.id')
  .then(results => {
    const hydrated = hydrateNotes(results);
    res.json(hydrated);
  })
  .catch(err => {
    next(err);
  });
});

// Get a single item
router.get('/:id', (req, res, next) => {
  const noteId = req.params.id;

  knex
    .select('notes.id', 'title', 'content', 'folders.id as folderId', 'folders.name as folderName','tags.name as tagName', 'tags.id as tagId')
    .from('notes')
    .leftJoin('folders', 'notes.folder_id', 'folders.id')
    .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
    .leftJoin('tags', 'notes_tags.tag_id', 'tags.id')
    .where({'notes.id': noteId})
    .then(result => {
      const hydrated = hydrateNotes(result);
      const note = hydrated[0];
      if(note) {
        res.json(note);
      }
      else {
        next();
      }
    })
    .catch(err => next(err));
});

// Put update an item
router.put('/:id', (req, res, next) => {
  const id = req.params.id;
  const tags = req.body.tags? req.body.tags : [];
  /***** Never trust users - validate input *****/
  let updateObj = {};
  const updateableFields = ['title', 'content', 'folderId'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      updateObj[field] = req.body[field];
    }
  });

  /***** Never trust users - validate input *****/
  if (!updateObj.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 404;
    return next(err);
  }

  const { title, content, folderId} = updateObj;
  updateObj = { 
    title,
    content, 
    folder_id: folderId? folderId : null
  };

  let noteId;
  knex('notes')
  .update(updateObj)
  .where({id: id})
  .returning('id')
  .then(([id]) => {
    noteId = id;
    if(!id) {
      const err = new Error();
      err.status = 404;
      next(err);
    }
    
    return knex('notes_tags')
      .where('notes_tags.note_id', noteId)
      .del();
  })
    .then(() => {
      const tagsInsert = tags.map(tag => ({tag_id: tag, note_id: noteId }));
      return knex('notes_tags')
        .insert(tagsInsert);
    })
    .then(() => {
      return knex('notes')
        .select('notes.id', 'title', 'content', 'folders.id as folderId', 'folders.name as folderName', 'tags.id as tagId', 'tags.name as tagName')
        .leftJoin('folders', 'folders.id', 'notes.folder_id')
        .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
        .leftJoin('tags', 'notes_tags.tag_id', 'tags.id')
        .where('notes.id', noteId);   
  })
    .then(results => {
      const note = hydrateNotes(results)[0];
      if(note) res.json(note);
      else next();
    })
    .catch(err => next(err));

});

// Post (insert) an item
router.post('/', (req, res, next) => {
  const { title, content, folderId, tags } = req.body;

  const newItem = { title, content, folder_id: folderId};
  /***** Never trust users - validate input *****/
  if (!newItem.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }
  let newNoteId; 
  knex('notes')
  .insert(newItem)
  .returning('id')
  .then(([id]) => {
    newNoteId = id;
    const tagsInsert = tags.map(tagId => (
      {note_id: newNoteId, tag_id: tagId}
    ));
    return knex('notes_tags').insert(tagsInsert);
    })
    .then(() => {
      return knex('notes')
        .select('notes.id', 'title', 'content', 'folders.id as folderId', 'folders.name as folderName', 'tags.id as tagId', 'tags.name as tagName')
        .leftJoin('folders', 'folders.id', 'notes.folder_id')
        .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
        .leftJoin('tags', 'notes_tags.tag_id', 'tags.id')
        .where('notes.id', newNoteId);
    })
    .then(result => {
      if(result){
        const hydrated = hydrateNotes(result)[0];
        res.location(`${req.originalUrl}/${hydrated.id}`).status(201).json(hydrated);
      } else {
        next();
      }
    })
    .catch(err => next(err));

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