const BaseController = require('./baseController');

class CityController extends BaseController {
  // constructor({ cityRepository, db, yup }) {
  constructor({ cityRepository, yup }) {
    super(cityRepository, yup); 
    this.getAllByState = this.getAllByState.bind(this);
    this.getFilter = this.getFilter.bind(this);
    this.getModelsToInclude = this.getModelsToInclude.bind(this);
  }

  createsUniquenessConstraint(inData) {
    const constraints = [];
    if (inData.Name) constraints.push({ Name: inData.Name });
    if (inData.Cod_City) constraints.push({ Cod_City: inData.Cod_City });
    return constraints;
  }

  extraValidations(inData) {
    return {
      success: true,
      message: '',
      unexpected: false,
    };
  }

  getFilter(req, filterSelector = null) {
    try {
      if (filterSelector === 'byState') {
        const { ID_State } = req.body;
        if (ID_State === undefined || ID_State === null) {
          return {
            success: false,
            message: 'ID_State is required',
            data: [],
            unexpected: false,
          };
        }
        if (!Number.isInteger(Number(ID_State))) {
          return {
            success: false,
            message: 'ID_State must be a valid integer.',
            data: [],
            unexpected: false,
          };
        }
        return {
          success: true,
          message: '',
          data: { ID_State },
          unexpected: false,
        };
      } else {
        return {
          success: true,
          message: '',
          data: {},
          unexpected: false,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: [],
        unexpected: true,
      };
    }
  }

  getModelsToInclude(optionSelector = null) {
    if (optionSelector === '*') {
      const includes = [{ model: 'State', attributes: ['Name', 'Acronym'] }];
      return includes;
    }
    if (optionSelector === '.') {
      const includes = [{ model: 'State' }];
      return includes;
    }
    return [];
  }

  async getAllByState(req, res) {
    return await this.getAll(req, res, 'byState');
  }
}

module.exports =  CityController;