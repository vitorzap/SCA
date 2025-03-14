const CustomError = require('../../utils/errors/customError');
const { showError } = require('../../utils/helpers/logHelpers');

class BaseDataQueryService {
  constructor(repository, otherParams = {}) {
    if (!repository) throw new Error('Repository must be provided.');
    this.repository = repository;

    Object.entries(otherParams).forEach(([key, value]) => {
      this[key] = typeof value === 'function' ? value.bind(this) : value;
    });
  }

  bindMethods(methods) {
    methods.forEach(method => {
      if (typeof this[method] === 'function') {
        this[method] = this[method].bind(this);
      }
    });
  }

  async getById({ id }, otherParams = {}) {
    try {
      if (!id) {
        throw new CustomError({ message: `Can't retrieve ${this.model.name} without a valid id` });
      }

      const modelsToInclude = this.getModelsToInclude('.');
      const result = await this.repository.findById(id, modelsToInclude);

      if (!result.success) {
        throw new CustomError({
          message: result.message,
          unexpected: result.error,
          data: result.data,
        });
      }

      return { success: true, message: result.message, data: result.data };
    } catch (error) {
      showError(error, { id });
      return this.handleError(error);
    }
  }

  async getAll(data, optionSelector = '*', otherParams = {}) {
    try {
      const safeOptionSelector = this.validateOptionSelector(optionSelector);
      const modelsToInclude = this.getModelsToInclude(safeOptionSelector);

      const filterResult = this.getFilter(data, safeOptionSelector);
      if (!filterResult.success) throw new CustomError(filterResult);

      const filter = filterResult.data;
      const result = await this.repository.findAll(filter, modelsToInclude);

      if (!result.success) throw new CustomError(result);

      return { success: true, message: result.message, data: result.data };
    } catch (error) {
      showError(error, { optionSelector });
      return this.handleError(error);
    }
  }

  validateOptionSelector(optionSelector) {
    if (!optionSelector || typeof optionSelector === 'function') return '*';
    if (['number', 'string', 'boolean'].includes(typeof optionSelector)) return optionSelector;
    throw new CustomError({ message: 'Invalid optionSelector parameter', unexpected: false });
  }

  handleError(error) {
    return {
      success: false,
      message: error.message,
      data: error instanceof CustomError ? error.data : {},
      unexpected: error instanceof CustomError ? error.unexpected : true,
    };
  }


  // ***********************************************
  // Methods that can be overridden in child classes
  // ***********************************************

  getModelsToInclude(optionSelector = null) {
    // if (optionSelector === '*') {
      //   const includes = [{ model: 'State', attributes: ['Name', 'Acronym'] }];
      //   return includes;
      // }
      // if (optionSelector === '.') {
        //   const includes = [{ model: 'State' }];
        //   return includes;
        // }
    return [];
  }
  
  
  getFilter(optionSelector = '*', data) {
    if (optionSelector === '*') {
      return { success: true,  message: '', data: {}, unexpected: false };
    }
    return {
      success: false,
      message: 'No filter especified',
      data: {},
      unexpected: error instanceof CustomError ? error.data : true
    };
  }
}

module.exports = BaseDataQueryService;




