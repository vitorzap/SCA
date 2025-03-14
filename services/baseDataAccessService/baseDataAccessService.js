const CustomError = require('../../utils/errors/customError');
const { showError } = require('../../utils/helpers/logHelpers');

class BaseDataAccessService {
  constructor(repository, otherParams = {}) {
    if (!repository) throw new Error('Repository must be provided.');
    this.repository = repository;

    Object.entries(otherParams).forEach(([key, value]) => {
      this[key] = typeof value === 'function' ? value.bind(this) : value;
    });

    // Bind main methods to ensure the correct `this` context
    [
      'executeAction', 'create', 'update', 'delete',
      'preCreate', 'posCreate', 'preUpdate', 'posUpdate',
      'preDelete', 'posDelete', 'showError',
      'getById', 'getAll', 'getFilter', 'getModelsToInclude'
    ].forEach(method => this[method] = this[method].bind(this));
  }

  /** ------------------------------------------ */
  /**  Centralized Method for Executing Actions  */
  /** ------------------------------------------ */
  async executeAction(data, action, steps) {
    let result;
    let currentStep;
    let dataAux = { ...data, action };
    let transaction = null;

    try {
      // If action is QUERY, do not start a transaction
      if (dataAux.action !== "QUERY") {
        transaction = await this.repository.transaction();
      }

      for (let i = 0; i < steps.length; i++) {
        currentStep = steps[i].name;
        result = await (typeof this[steps[i].method] === "function"
          ? this[steps[i].method](dataAux, transaction)
          : this.repository[steps[i].method](dataAux, transaction));

        if (!result || !result.success) {
          throw new CustomError({
            message: `Error in ${currentStep} for action ${action} => ${result?.message || "Unknown error"}`,
            unexpected: result?.error ?? true,
            data: result?.data || {},
          });
        }

        dataAux[`${currentStep.toLowerCase()}Data`] = { ...result.data };
      }

      if (transaction && !transaction.finished) {
        await transaction.commit();
      }

      return {
        success: true,
        message: `${this.repository.getModelName()} ${action.toLowerCase()} executed successfully`,
        data: dataAux[steps[steps.length - 1].name.toLowerCase() + "Data"], // Returns the final execution data
        unexpected: false,
      };

    } catch (error) {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
      showError(error, { step: currentStep, dataAux });
      return {
        success: false,
        message: error.message,
        data: error instanceof CustomError ? error.data : {},
        error: error instanceof CustomError ? error.unexpected : true,
      };
    }
  }

  /** ------------------------------------------ */
  /**  Persistence Methods                       */
  /** ------------------------------------------ */
  async create(data) {
    return await this.executeAction({ ...data, action: "CREATE" }, "Create", [
      { name: "PreCreate", method: "preCreate" },
      { name: "Create", method: "create" },
      { name: "PosCreate", method: "posCreate" },
    ]);
  }

  async update(data) {
    return await this.executeAction({ ...data, action: "UPDATE" }, "Update", [
      { name: "PreUpdate", method: "preUpdate" },
      { name: "Update", method: "update" },
      { name: "PosUpdate", method: "posUpdate" },
    ]);
  }

  async delete(data) {
    return await this.executeAction({ ...data, action: "DELETE" }, "Delete", [
      { name: "PreDelete", method: "preDelete" },
      { name: "Delete", method: "delete" },
      { name: "PosDelete", method: "posDelete" },
    ]);
  }

  /**  Methods that can be overridden by child classes */
  async preCreate(data, transaction = null) { return { success: true, message: '', data: {}, unexpected: false }; }
  async posCreate(data, transaction = null) { return { success: true, message: '', data: {}, unexpected: false }; }
  async preUpdate(data, transaction = null) { return { success: true, message: '', data: {}, unexpected: false }; }
  async posUpdate(data, transaction = null) { return { success: true, message: '', data: {}, unexpected: false }; }
  async preDelete(data, transaction = null) { return { success: true, message: '', data: {}, unexpected: false }; }
  async posDelete(data, transaction = null) { return { success: true, message: '', data: {}, unexpected: false }; }

  /** ------------------------------------------ */
  /**   Query Methods                            */
  /** ------------------------------------------ */
  async getById({ id }) {
    if (!id) {
      throw new CustomError({ message: `Can't retrieve ${this.repository.getModelName()} without a valid id` });
    }

    return await this.executeAction({ id, action: "QUERY" }, "GetById", [
      { name: "GetModelsToInclude", method: "getModelsToInclude" },
      { name: "FindById", method: this.repository.findById.bind(this.repository) } // Directly calling the repository
    ]);
  }

  async getAll(data, optionSelector = '*') {
    return await this.executeAction({ ...data, optionSelector, action: "QUERY" }, "GetAll", [
      { name: "ValidateOptionSelector", method: "validateOptionSelector" },
      { name: "GetModelsToInclude", method: "getModelsToInclude" },
      { name: "GetFilter", method: "getFilter" },
      { name: "FindAll", method: this.repository.findAll.bind(this.repository) } // Directly calling the repository
    ]);
  }

  validateOptionSelector(data) {
    const { optionSelector } = data;
    const validSelector = !optionSelector || typeof optionSelector === 'function'
      ? '*'
      : ['number', 'string', 'boolean'].includes(typeof optionSelector)
        ? optionSelector
        : (() => { throw new CustomError({ message: 'Invalid optionSelector parameter', unexpected: false }) })();

    return { success: true, data: validSelector };
  }
  
  /**  Methods that can be overridden by child classes */
  
  // Retrieves models to be included in queries.
  getModelsToInclude(data) {
    return { success: true, data: [] }; // Can be adjusted to return the correct models
  }

  // Generates the filter object for queries.  
  getFilter(data) {
    const { optionSelector } = data;
    if (optionSelector === '*') {
      return { success: true, data: {} };
    }
    return {
      success: false,
      message: 'No filter specified',
      data: {},
      unexpected: true
    };
  }
}

module.exports = BaseDataAccessService;