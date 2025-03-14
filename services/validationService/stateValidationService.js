const BaseValidationService = require('./baseValidationService'); 

class StateValidationService extends BaseValidationService {
  constructor({ stateRepository, yup, ValidationHelper }) {
    super(stateRepository, yup, ValidationHelper); 
  }


  createsUniquenessConstraint(data) {
    try {
      const arrayOfConstraints = [];
      const constraints = [];
      
      if (data.Name) { constraints.push({ Name: data.Name }); }
      if (data.Acronym ) { constraints.push({ Acronym: data.Acronym }); }
      if (data.Cod_State) { constraints.push({ Cod_State: data.Cod_State }); }

      arrayOfConstraints.push(constraints);
      return  arrayOfConstraints;
    } catch (error) {
      return { 
        success: false,
        message: `An unexpected error occurred during uniqueness constraint creation => ${error.message}`, 
        data: '',
        unexpected: true 
      };
    }
  }

}

module.exports =  StateValidationService;