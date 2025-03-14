const CustomError = require('../../utils/errors/customError');
const { showError } = require('../../utils/helpers/logHelpers');

class BaseDataPersistenceService {
  constructor(repository, otherParams = {}) {
    if (!repository) throw new Error('Repository must be provided.');
    this.repository = repository;
    
    // Dynamically assign additional parameters as instance properties
    Object.keys(otherParams).forEach((key) => {
      this[key] = otherParams[key]; 
      if (typeof this[key] === "function") {
        this[key] = this[key].bind(this); 
      }
    });

       
    // Bind methods to ensure the correct `this` context
    // Bind methods dynamically
    this.bindMethods([
      'executeTransactionStep', 'create', 'update', 'delete',
      'preCreate', 'posCreate', 'preUpdate', 'posUpdate', 
      'preDelete', 'posDelete', 'showError'
    ]);
  }

  // Generic method to bind all specified methods
  bindMethods(methods) {
    methods.forEach(method => {
      if (typeof this[method] === 'function') {
        this[method] = this[method].bind(this);
      }
    });
  }

  async executeAction(data, action, steps) {
    let result;
    let currentStep;
    let dataAux = { ...data };
    let transaction;
  
    try {
      transaction = await this.repository.transaction();
  
      for (let i = 0; i < steps.length; i++) {
        currentStep = steps[i].name;
        result = await (typeof this[steps[i].method] === "function"
          ? this[steps[i].method](dataAux, transaction)
          : this.repository[steps[i].method](dataAux, transaction));
  
        if (!result.success) {
          throw new CustomError({
            message:`Error in ${currentStep} for action ${action} => ${result.message}`,
            unexpected: result.error,
            data: result.data,
          });
        }
  
        dataAux[`${currentStep.toLowerCase()}Data`] = { ...result.data };
      }
  
      if (transaction && !transaction.finished) {
        await transaction.commit();
      }
  
      return {
        success: true,
        message: `${this.repository.getModelName()} ${action.toLowerCase()}d successfully`,
        data: {
          ...dataAux['createdata'],
          pre: { ...dataAux[`pre${action.toLowerCase()}Data`] },
          pos: { ...dataAux[`pos${action.toLowerCase()}Data`] },
        },
        unexpected: false,
      };
  
    } catch (error) {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
      this.showError(error, { step: currentStep, dataAux });
      return {
        success: false,
        message: error.message,
        data: error instanceof CustomError ? error.data : {},
        error: error instanceof CustomError ? error.unexpected : true,
      };
    }
  }

  async create(data) {
    return await this.executeAction(data, "Create", [
      { name: `PreCreate`, method: "preCreate" },
      { name: "Create", method: "create" },
      { name: `PosCreate`, method: "posCreate" },
    ]);
  }

  async update(data) {
    return await this.executeAction(data, "Update", [
      { name: `PreUpdate`, method: "preUpdate" },
      { name: "Update", method: "update" },
      { name: `PosUpdate`, method: "posUpdate" },
    ]);
  }

  async delete(data) { 
    return await executeAction(data, "Delete", [
      { name: `PreDelete`, method: "preDelete" },
      { name: "Delete", method: "delete" },
      { name: `PosDelete`, method: "posDelete" }
    ]);  
  } 


  // ***********************************************
  // Methods that can be overridden in child classes
  // ***********************************************
  
  async preCreate(data, transaction = null) 
    { return {success: true, message: '', data: {}, unexpected: false };}
  async posCreate(data, transaction = null) { 
    return { success: true, message: '', data: {}, unexpected: false }; }
  async preUpdate(data, transaction = null) { 
    return { success: true, message: '', data: {}, unexpected: false }; }
  async posUpdate(data, transaction = null) { 
    return { success: true, message: '', data: {}, unexpected: false }; }
  async preDelete(data, transaction = null) { 
    return { success: true, message: '', data: {}, unexpected: false }; }
  async posDelete(data, transaction = null) { 
    return { success: true, message: '', data: {}, unexpected: false }; }

  //************************************************

}


module.exports = BaseDataPersistenceService;
