'use strict';

const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const knex = require('../knex');
const expect = chai.expect;

chai.use(chaiHttp);

describe('Static Server', function () {

  it('GET request "/" should return the index page', function () {
    return chai.request(app)
      .get('/')
      .then(function (res) {
        expect(res).to.exist;
        expect(res).to.have.status(200);
        expect(res).to.be.html;
      });
  });
});

describe('Noteful API', function () {
  const seedData = require('../db/seedData');

  beforeEach(function () {
    return seedData('./db/noteful.sql');
  });

  after(function () {
    return knex.destroy(); // destroy the connection
  });

  describe('GET /api/notes', function () {

    it('should return the default of 10 Notes ', function () {
      return chai.request(app)
        .get('/api/notes')
        .then(function (res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(10);
        });
    });

    it('should return correct search results for a valid query', function () {
      return chai.request(app)
        .get('/api/notes')
        .query({searchTerm: 'about cats'})
        .then(function (res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(4);
          expect(res.body[0]).to.be.an('object');
        });
    });

    it('should return an array of objects where each item contains id, title, and content', function () {

      return chai.request(app)
      .get('/api/notes')
      .then(function (res) {
        res.body.forEach(note => {
          expect(note).to.have.keys('id', 'title', 'content', 'folderId', 'folderName', 'tags');
        });
      });
    });

    it('should return an empty array for an incorrect searchTerm', function () {
      const invalidSearchTerm = 'invalidsearchterm';

      return chai.request(app)
        .get('/api/notes')
        .query({searchTerm: invalidSearchTerm})
        .then(function (res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(0);
        });

    });

  });

  describe('404 handler', function () {

    it('should respond with 404 when given a bad path', function () {
      const badPath = '/bad/path';

      return chai.request(app)
        .get(badPath)
        .then(function(res){
          expect(res).to.have.status(404);
        });
    });

 describe('GET /api/notes/:id', function () {

    it('should return correct note when given an id', function () {

      const fields = ['id','title', 'content', 'folderId'];
      let id;

      return knex
        .select('id')
        .from('notes')
        .limit(1)
        .then(results => {  
          id = results[0].id;

          const dbPromise = knex
            .select()
            .from('notes')
            .where('id', id);

          const requestPromise = chai.request(app)
            .get(`/api/notes/${id}`);
        
          return Promise.all([dbPromise, requestPromise])
            .then(([notes, res]) => {
              const note = notes[0];
              expect(res).to.have.status(200);
              expect(res).to.be.json;
              fields.forEach(field => {
                if(res.body[field]) expect(res.body[field]).to.equal(note[field]);
              });
            });
        });
    });
  });

  describe('POST /api/notes', function () {

    it('should create and return a new item when provided valid data', function () {
      const newNote = {
        title: 'The New Colossus',
        content: 'Not like the brazen giant of Greek fame...',
        folderId: 100,
        tags: [1, 2]
      };

      return chai.request(app)
        .post('/api/notes')
        .send(newNote)
        .then(function(res){
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.all.keys('id', 'title', 'content', 'folderId', 'folderName', 'tags');
          Object.keys(newNote).forEach(property => {
            if(property !== 'tags') expect(res.body[property]).to.equal(newNote[property]);
            else expect(property.length) === newNote.tags.length;
          });
        });
    });

    it('should return an error when missing "title" field', function () {
      const invalidNote = {
        content: 'Not like the brazen giant of Greek fame...',
        folderId: 100,
        tags: [1, 2]
      };
      return chai.request(app)
      .post('/api/notes')
      .send(invalidNote)
      .then(function(res){
        expect(res).to.have.status(400);
      });
    });

  });

  });

  describe('PUT /api/notes/:id', function () {
    const updateObj = {
      title: 'Gettysburg Address',
      content: 'Four scores and seven years ago. . .',
      folderId: 100,
      tags: [1,2]
    };

    it('should update the note', function () {
      
      let id;
      
      return knex
        .select()
        .from('notes')
        .limit(1)
        .then(results => {
          const note = results[0];
          id = note.id

          return chai.request(app)
            .put(`/api/notes/${id}`)
            .send(updateObj)
            .then(function(res){
              expect(res).to.have.status(200);
              expect(res).to.be.json;
              expect(res.body).to.be.an('object');
              expect(res.body).to.contain.keys('id', 'title', 'content','folderId', 'folderName', 'tags');

              return knex 
                .select()
                .from('notes')
                .where('id', id)
                .then(results => {
                  const note = results[0];
                  expect(note.title).to.equal(updateObj.title);
                  expect(note.content).to.equal(updateObj.content);
                  expect(note.folder_id).to.equal(updateObj.folderId);
                });
            });
        })
    });

    it('should respond with a 404 for an invalid id', function () {
      const invalidId = 999999;

      return chai.request(app)
        .put(`/api/notes/${invalidId}`)
        .send(updateObj)
        .then(function(res){
          expect(res).to.have.status(404);
        });
    });

    it('should return an error when missing "title" field', function () {
      let id;
      const invalidNote = {
        content: 'Four scores and seven years ago. . .',
        folderId: 100
      };

      return knex 
        .select()
        .from('notes')
        .limit(1)
        .then(function(results){
          const note = results[0];
          id = note.id;

          return chai.request(app)
            .put(`/api/notes/${id}`)
            .send(invalidNote)
            .then(function(res){
              expect(res).to.have.status(404);
            });
        });
    });
  });

  describe('DELETE /api/notes/:id', function () {

    it('should delete an item by id', function () {
      let id;
      
      return knex
        .select()
        .from('notes')
        .limit(1)
        .then(results => {
          const note = results[0];
          id = note.id;

          return chai.request(app)
            .delete(`/api/notes/${id}`)
            .then(function(res){
              expect(res).to.have.status(204);

              //make sure the specified note is actually deleted from the database
              return knex
                .from('notes')
                .select()
                .where('id', id)
                .then(results => {
                  const note = results[0];
                  expect(note).to.be.undefined;
                });
            });
          });
    });
  });

});
