const CustomError = require('../../utils/errors/customError');
const ValidationHelper = require('../../utils/helpers/validationHelper');


class BaseValidationService {
  constructor( repository, yup, otherParams = {} ) {
    if (!repository) throw new Error(' repository must be provided.');
    this.repository = repository;
    if (!yup) throw new Error('yup must be provided.');
    this.yup = yup;
    this.otherParams = otherParams;

    this.bindMethods([
      'validate', 'getModelValidationSchema', 'doSchemaValidations',
      'createsUniquenessConstraint', 'extraValidations', 'handleError'
    ]);    
  
  }

  // Binds methods to ensure the correct `this` context
  bindMethods(methods) {
    methods.forEach(method => this[method] = this[method].bind(this));
  }

  async validate(data) {
    let result;

    let getModelSchemaResult;
    let validationSchema;
    let validationResult;
    let constraintResult;
    try {
        const primaryKey = this.repository.getPrimaryKey();
        let auxData = { ...data };
        
        // If there is an ID(primaryKey), search for existing data to complement it
        if (auxData[primaryKey]) {
          const result = await this.repository.findById(auxData[primaryKey]);
          if (!result.success) return result;
          auxData = { ...result.data, ...auxData };
        }
        // Schema validation
        const validationSchema = 
            this.getModelValidationSchema(
                      this.repository.getModelName(), 
                      auxData['action']
                    );
        let result = await this.doSchemaValidations(auxData, validationSchema);
        if (!result.success) return result;   
        
        // Check for uniqueness constraints
        result = this.createsUniquenessConstraint(auxData); 
        if (!result.success) return result;

        const excludeId = auxData[primaryKey] || null;
        for (const constraint of result.data) {
          const uniqueCheck = await this.repository.findByUniqueConstraints(constraint, excludeId);
          if (uniqueCheck.success) return uniqueCheck;
        }
        // Extra validations
        result = this.extraValidations(auxData) 
        if (!result.success) return result;  

        return { success: true, message: '', data: '', unexpected: false }
    } catch (error) {
        return this.handleError(error, 'Validation Error');
    } 
  }

  getModelValidationSchema(modelName, action) {
    if (!modelName) {
      throw new CustomError({ message: 'Model name is required', unexpected: false });
    }
    if (!action) {
      throw new CustomError({ message: 'Action is required', unexpected: false });
    }
    const validationSchema = 
      ValidationHelper.getModelValidationSchema(modelName.toUpperCase(), action);
 
    return validationSchema || yup.object().shape({});
  }

  async doSchemaValidations(data, schema) {
    try {
      await schema.validate(data, { abortEarly: false });
      return { success: true, message: '', data: '', unexpected: false };
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        return {
          success: false,
          message: error.inner.map(err => err.message).join('; '),
          data,
          unexpected: false
        };
      }
      return this.handleError(error, 'Schema Validation Error');
    }
  }

  handleError(error, context) {
    return {
      success: false,
      message: `Error in ${context}: ${error.message}`,
      data: {},
      unexpected: true
    };
  }

  // Creates an array of unique constraints to checking these restrictions 
  // in data validation. The restriction array must be placed in data. 
  // When instantiating this class, this method can be overridden by code 
  // that creates the necessary filters for the instance. Remember that
  // there is an action field in inData, which can be used to control
  // whether and which uniqueness test to use for CREATE, UPDATE, DELETE and QUERY cases
  createsUniquenessConstraint(data) {
    return { success: true, message: '', data: [], unexpected: false };
  }

  // If you need to add validations when instantiating, do so here,
  //  overriding this method.Remembering that there is an action field in inData,
  // which can be used to control the type of validation specific to
  // the cases of CREATE, UPDATE, DELETE and QUERY
    extraValidations(inData) {
      return { success: true, message: '', data: {}, unexpected: false };
    }  

}

module.exports = BaseValidationService;