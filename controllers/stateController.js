const BaseController = require('./baseController'); 

class StateController extends BaseController {

  constructor({ dataMergeService, stateRepository, stateValidationService }) {
    super(dataMergeService, stateRepository, stateValidationService); 
  }
}

module.exports =  StateController;