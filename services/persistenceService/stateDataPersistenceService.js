const BaseDataPersistenceService = require('./baseDataPersistenceService'); 

class StateDataPersistenceService extends BaseDataPersistenceService {

  constructor({ stateRepository }) {
    super( stateRepository ); 
  }
}

module.exports = StateDataPersistenceService;