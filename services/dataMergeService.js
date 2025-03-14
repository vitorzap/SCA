const { showError } = require('../utils/helpers/logHelpers');

class DataMergeService {
  constructor({ dataMergeHelper, otherParams = {} }) { // Injeta as dependências via Awilix
    this.dataMergeHelper = dataMergeHelper;
    this.otherParams = otherParams;

    this.getMergedData = this.getMergedData.bind(this);
    this.getReqActionName = this.getReqActionName.bind(this);
    this.getApiResource = this.getApiResource.bind(this);
  } 

  getReqActionName(req) {
    switch (req.method) {
      case 'GET': return 'QUERY';
      case 'POST': return 'CREATE';
      case 'PUT': return 'UPDATE';
      case 'DELETE': return 'DELETE';
      default: throw new Error('Unknown action');
    }
  }

  getApiResource(req) {
    const path = req.path; 
    if (!path.startsWith('/api/')) return null;
    
    const resource = path.split('/')[2];
    return resource ? resource.toUpperCase() : null;
  }

  getMergedData(req) {
    let dataMerged;
    try {
      dataMerged = {
        ...req.params,
        ...req.body,
        ...req.query
      };

      dataMerged['action'] = this.getReqActionName(req);
      dataMerged['modelName'] = this.getApiResource(req);
      
      this.dataMergeHelper.setResultingFields(dataMerged, this.otherParams);
      this.dataMergeHelper.removeFields(dataMerged);

      const fieldsToConvert = ['id', 'pageNumber', 'pageSize'];

      fieldsToConvert.forEach(field => {
        if (dataMerged[field]) {
          const parsedValue = parseInt(dataMerged[field], 10);
          if (isNaN(parsedValue)) {
            throw new Error(`Invalid ${field}: ${field} must be an integer`);
          }
          dataMerged[field] = parsedValue;
        }
      });
      if (!('pageSize' in dataMerged)) {
        delete dataMerged.pageSize;
        delete dataMerged.pageNumber;
      } else {
        if (!('pageNumber' in dataMerged)) {
          dataMerged.pageNumber = 1;
        }
        dataMerged.pageOffSet = (dataMerged.pageNumber - 1) * dataMerged.pageSize;
      }

      return {
        success: true,
        message: '',
        data: dataMerged,
        unexpected: false,
      };

    } catch (error) {
      showError(error, { dataMerged });
      return {
        success: false,
        message: `Error while processing dataMerged: ${error.message}`,
        data: {},
        unexpected: true,
      };
    }
  }
}

module.exports = dataMergeService;