'use strict';

const knex = require('../knex');
/*
let searchTerm = 'gaga';
knex
  .select('notes.id', 'title', 'content')
  .from('notes')
  .modify(queryBuilder => {
    if (searchTerm) {
      queryBuilder.where('title', 'like', `%${searchTerm}%`);
    }
  })
  .orderBy('notes.id')
  .then(results => {
    console.log(JSON.stringify(results, null, 2));
  })
  .catch(err => {
    console.error(err);
  });
*/

//Get Note By Id query
const id = 1;

/*
knex
  .select()
  .from('notes')
  .where({id: id})
  .then(result => console.log(JSON.stringify(result, null, 2))
  );
*/

  //Update Note by Id query

  /*
const updateObj = {
  title: 'foo',
  content: 'bar'
};

knex('notes')
  .update(updateObj)
  .where({id: id})
  .returning(['id', 'title', 'content'])
  .then(result => console.log(JSON.stringify(result[0], null, 2)));

*/

//Create a Note query

/*
const noteObject = {
  title: 'fizz',
  content: 'buzz'
};

knex('notes')
  .insert(noteObject)
  .returning(['id', 'title', 'content'])
  .then(result => console.log(JSON.stringify(result[0], null, 2)));

  */

  //Delete Note by Id query

  const testId = 1;

  knex('notes')
  .where('id', testId)
  .delete()
  .then(result => console.log(result));