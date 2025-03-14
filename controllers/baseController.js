const CustomError = require('../../utils/errors/customError');

class BaseController {
  constructor(dataMergeService, 
              dataAccessService,
              validationService,
              otherParams = {}) {
    if (!dataMergeService) throw new Error('dataMergeService must be provided.');
    this.dataMergeService = dataMergeService;
    if (!dataAccessService) throw new Error('dataAccessService must be provided.');
    this.dataAccessService = dataAccessService;
    if (!validationService) throw new Error('validationService must be provided.');
    this.validationService = validationService;

    // Dynamically assign additional parameters as instance properties
    Object.keys(otherParams).forEach((key) => {
      this[key] = otherParams[key]; 
      if (typeof this[key] === "function") {
        this[key] = this[key].bind(this); 
      }
    });

    // Bind methods to ensure the correct `this` context
    this.bindMethods([
      'create', 'update', 'delete', 'getById', 'getAll',
      'handleRequest', 'handleError', 'beforeMainAction', 'afterMainAction'
    ]);

    // Binds all specified methods to the instance
    bindMethods(methods) {
      methods.forEach(method => {
        if (typeof this[method] === 'function') {
          this[method] = this[method].bind(this);
        }
      });
    }
}

  // ****************************************************************
  // Generic method for handling requests (Create, Update, Delete, Query)
  // ****************************************************************
  async handleRequest(req, res, action, query = false) {
    try {
      let result = this.dataMergeService.getMergedData(req);
      if (!result.success) {
        const { success, ...rest } = result;
        throw new CustomError(rest);
      }

      let dataPipe = { ...result.data };

      if (!query) {
        result = this.validationService.validateData(dataPipe, this.repository);
        if (!result.success) {
          const { success, ...rest } = result;
          throw new CustomError(rest);
        }
      }

      result = await this.dataAccessService[action](dataPipe);
      if (!result.success) {
        throw new CustomError(result);
      }

      return res.status(query ? 200 : (action === "create" ? 201 : 200)).json(result);
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  // ****************************************************************
  // Methods that can be overridden by subclasses
  // ****************************************************************
  async beforeMainAction(action, dataPipe) {
    return {
      success: true,
      message: "",
      data: dataPipe,
      error: false
    };
  }

  async afterMainAction(action, dataPipe, result) {
    return {
      success: true,
      message: result.message,
      data: result.data,
      unexpected: result.unexpected
    };
  }

  // ****************************************************************
  // Method for centralized error handling
  // ****************************************************************
  handleError(res, error) {
    if (error instanceof CustomError) {
      return res.status(error.unexpected ? 500 : 400).json({
        message: error.message,
        data: error.data,
        unexpected: error.unexpected
      });
    }
    return res.status(500).json({ message: "Unexpected server error", unexpected: true });
  }

  // ****************************************************************
  // Specific methods calling `handleRequest`
  // ****************************************************************
  async create(req, res) {
    return this.handleRequest(req, res, "create");
  }

  async update(req, res) {
    return this.handleRequest(req, res, "update");
  }

  async delete(req, res) {
    return this.handleRequest(req, res, "delete");
  }

  async getById(req, res) {
    return this.handleRequest(req, res, "getById", true);
  }

  async getAll(req, res) {
    return this.handleRequest(req, res, "getAll", true);
  }
}

module.exports = BaseController;