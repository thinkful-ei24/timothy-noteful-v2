const express = require('express');
const knex = require('../knex'); 

const foldersRouter = express();

foldersRouter.get('/', (req, res) => {
    knex
        .select('id', 'name')
        .from('folders')
        .then(result => res.json(result));
});

foldersRouter.get('/:id', (req, res, next) => {
    const folderId = req.params.id;
    knex
        .select('id', 'name')
        .from('folders')
        .where({id: folderId})
        .then(result => {
            if(result[0]) res.json(result[0]);
            else next();
        });
});

foldersRouter.put('/:id', (req, res, next) => {
    const updateObj = {};
    const folderId = req.params.id;
    const updateableFields = ['name'];
    updateableFields.forEach(field => {
        if(field in req.body) updateObj[field] = req.body[field];
    });

    if (!updateObj.name) {
        const err = new Error('Missing `name` in request body');
        err.status = 400;
        return next(err);
      }

      knex('folders')
        .update(updateObj)
        .where({id: folderId})
        .returning(['id', 'name'])
        .then(results => {
            if(results[0]) res.json(results[0]);
            else next();
        });
});

foldersRouter.post('/', (req, res, next) => {
    const newFolder = req.body;
    if(!newFolder.name) {
        const err = new Error('Missing name in request body');
        err.status = 400;
        return next(err);
    }

    knex('folders')
        .insert(newFolder)
        .returning(['id', 'name'])
        .then(results => {
            const folder = results[0];
            if(folder) res.status(201).location(`${res.url}/${folder.id}`).json(folder);
        });
});

foldersRouter.delete('/:id', (req, res, next) => {
    const folderId = req.params.id;
    knex('folders')
        .where({id: folderId})
        .del()
        .then(() => {
            res.sendStatus(204);
        });

});


module.exports = foldersRouter;