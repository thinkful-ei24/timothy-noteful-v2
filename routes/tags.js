const express = require('express');
const knex = require('../knex');
const tagsRouter = express();

tagsRouter.get('/', (req, res) => {

    knex
        .select('id', 'name')
        .from('tags')
        .then(results => res.json(results));
});

tagsRouter.get('/:id', (req, res, next) => {
    const tagId = req.params.id;
    
    knex
        .select('id', 'name')
        .from('tags')
        .where('id', tagId)
        .then(results => {
            const tag = results[0];
            if(tag) res.json(tag);
            else next();
        });

});

tagsRouter.put('/:id', (req, res, next) => {
    const tagId = req.params.id;
    const updateObj = {};
    if('name' in req.body) updateObj['name'] = req.body.name;

    if(!updateObj.name) {
        const err = new Error('Missing name in request body');
        err.status = 400;
        return next(err);
    }

    knex
        .update(updateObj)
        .from('tags')
        .where('id', tagId)
        .returning(['id', 'name'])
        .then(results => {
            const tag = results[0];
            if(tag) res.json(tag);
            else next();
        });
});

tagsRouter.post('/', (req, res, next) => {
    if(!req.body.name) {
        const err = new Error('Missing name in request body');
        err.status = 400;
        return next(err);
    }

    const { name } = req.body;
    const newTag = { name };
    
    knex('tags')
        .insert(newTag)
        .returning(['id', 'name'])
        .then(results => {
            const tag = results[0];
            if(tag) res.location(`${res.url}/${tag.id}`).status(201).json(tag);
        })
        .catch(err => next(err));
});

tagsRouter.delete('/:id', (req, res, next) => {
    const tagId = req.params.id;

    knex
        .from('tags')
        .where('id', tagId)
        .del()
        .then(() => {
            res.sendStatus(204);
        })
        .catch(err => next(err));
});



module.exports = tagsRouter;