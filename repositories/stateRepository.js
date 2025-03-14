const BaseRepository = require('./baseRepository'); 

class StateRepository extends BaseRepository {
  constructor({ db }) {
    super('State', db); 
  }
}

module.exports =  StateRepository ; 
