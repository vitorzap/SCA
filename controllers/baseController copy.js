const path = require('path');
const { validateData, getBaseSchema } = require ('../utils/validation/yupHelpers')
const { showError: extShowError } = require('../utils/helpers/logHelpers')
const { formatFilter: extFormatFilter } = require('../utils/filter/formatFilterHelpers')
const { joinTextsWithSeparator } = require('../utils/string/stringHelpers');
const getValidationSchemas = require('../utils/validation/validationSchemas');


class BaseController {
  // constructor(repository,yup) {
  constructor(repository,yup) {
    if (!repository) {
      throw new Error('A valid repository must be provided.');
    }
    if (!yup) {
      throw new Error('Yup must be provided.');
    }
    this.repository = repository;
    this.yup = yup; 
    
    // Bind methods to ensure the correct `this` context
    
    this.getModelName = this.getModelName.bind(this);
    this.getExtraFieldsNames = this.getExtraFieldsNames.bind(this);
    this.extractFields = this.extractFields.bind(this);
    this.addFields = this.addFields.bind(this);
    this.getModelSchema = this.getModelSchema.bind(this);
    this.createsUniquenessConstraint = this.createsUniquenessConstraint.bind(this);
    this.getModelsToInclude = this.getModelsToInclude.bind(this);
    this.getFilter = this.getFilter.bind(this);
    this.dataValidations = this.dataValidations.bind(this);
    this.extraValidations = this.extraValidations.bind(this);
    this.preCreate = this.preCreate.bind(this);
    this.posCreate = this.posCreate.bind(this);
    this.preUpdate = this.preUpdate.bind(this);
    this.posUpdate = this.posUpdate.bind(this);
    this.preDelete = this.preDelete.bind(this);
    this.posDelete = this.posDelete.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
    this.getById = this.getById.bind(this);
    this.getAll = this.getAll.bind(this);
    this.getDataFromRequest = this.getDataFromRequest.bind(this);
    this.showError = this.showError.bind(this);
    this.formatFilter = this.formatFilter.bind(this);
  }

  getModelName() {
    return this.repository.getModelName();
  }

// getExtraField - This function can be overridden.
// Any property of request.body that has the same name as the 
// names of the model fields will be extracted from it. 
// If it is necessary to extract other properties, 
// this function must provide a list of their names
  getExtraFieldsNames(originAction) {
    const action = originAction.toUpperCase();
    if (action === 'CREATE') {
      return [];
    } else if (action === 'UPDATE') {
      return [];
    } else if (action === 'DELETE') {
      return [];
    }
    throw new Error(`Unknown action '${originAction}' provided to function getExtraFieldsNames.`);
  }

  // extractFields - This function should not be overridden.
  // Extracts the properties from request.body whose names are 
  // passed as a parameter and creates a new object with them
  extractFields(fieldsTobeEtractedArray, requestBody) {
    const extractedObject = {};
  
    fieldsTobeEtractedArray.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(requestBody, field)) {
        extractedObject[field] = requestBody[field];
      }
    });
  
    return extractedObject;
  }


  addFields(reqbody, obj = {}) {
    // if (reqbody.xxxx) {
    //   obj.xxx = reqbody.xxxx;
    // }
    return obj;
  }

  // Creates a default Yup schema for validation.
  // This method can be overridden in child controllers.
  getModelSchema() {
    const validationSchema = getValidationSchemas()[this.getModelName().toUpperCase()];
    if (!validationSchema) {
      throw new Error(`Schema not found for model: ${modelName}`);
    }
    return validationSchema
  }

  // create unique constraint filter for checking
  createsUniquenessConstraint(inData) {
    return {
      success: false, 
      message: '', 
      data: '',
      unexpected: false       
    }
  }

  async dataValidations(inData) {
    let getModelSchemaResult;
    let validationSchema;
    let findResult;
    let validationResult;
    let constraintResult;
    try {
        let newData = { ...inData };
        // If newData.update is true then it is an update, 
        // and the identifier(primaryKey) must exist
        const primaryKey = this.repository.getPrimaryKey();
        if (newData[primaryKey]) {
          findResult = await this.repository.findById(newData[primaryKey]);
          if (!findResult.success) {
            return (({ data, ...rest }) => rest)(findResult);
          }
          newData = { ...findResult.data, ...newData };
        }
        validationSchema = getBaseSchema() // Base validations
        validationResult = await validateData(newData,validationSchema );
        if (!validationResult.success) {
          return validationResult;
        }         
        if (!newData.DELETE) {
          // Schema model specific validations using Yup
          validationSchema = this.getModelSchema();
          validationResult = await validateData(newData,validationSchema );
          if (!validationResult.success) {
            return validationResult;
          }     
          
          // Check for uniqueness constraints
          constraintResult = this.createsUniquenessConstraint(newData) 
          if (constraintResult.error) {
            return (({ data, ...rest }) => rest)(constraintResult);
          }
          if (constraintResult. success) {
            const excludeId = newData[primaryKey] || null;
            const findUniqueResult = 
            await this.repository.findByUniqueConstraints(
              constraintResult.data,  
              excludeId
            );
            if (findUniqueResult.success) {
              return (({ data, ...rest }) => rest)(constraintResult);
            }
          }
        }
        console.log('dataValidations 0x') 
        // Extra validations
        validationResult = this.extraValidations(newData) 
        if (!validationResult.success) {
          return validationResult;
        } 
        return { success: true, message: '', unexpected: false }
    } catch (error) {
      return { 
        success: false,
        message: `An unexpected error occurred during validation => ${error.message}`, 
        unexpected: true 
      };
    } 
  }

  extraValidations(inData) {
    return {
      success: true, 
      message: '', 
      unexpected: false       
    }
  }

  showError(error, variables = {}) {
    extShowError(error, variables);
  }

  formatFilter(searchItem) {
    console.log('searchItem',searchItem)
    return extFormatFilter(searchItem);
  }

   // Procedures to be carried out before the inclusion of the main record
   async preCreate(dataPipe, transaction = null ) {
    return {
      success: true, 
      message: '', 
      data: '',
      unexpected: false       
    }
  }

   // Procedures to be carried out after the inclusion of the main record
  async posCreate(dataPipe, transaction = null ) {
    return {
      success: true, 
      message: '', 
      data: '',
      unexpected: false       
    }
  }
  
   // Procedures to be followed before changing the main record
   async preUpdate(dataPipe, transaction = null) {
    return {
      success: true, 
      message: '', 
      data: '',
      unexpected: false       
    }
  }
  
   // Procedures to be followed after changing the main record
   async posUpdate(dataPipe, transaction = null) {
    return {
      success: true, 
      message: '', 
      data: '',
      unexpected: false       
    }
  }
   
   // Procedures to be followed before deleting the main record
   async preDelete(dataPipe, transaction = null) {
    return {
      success: true, 
      message: '', 
      data: '',
      unexpected: false       
    }
  } 

   // Procedures to be followed after deleting the main record
   async posDelete(dataPipe, transaction = null) {
    return {
      success: true, 
      message: '', 
      data: '',
      unexpected: false       
    }
  }

  // Determines which associated models should be included in a database query
  getModelsToInclude(optionSelector = null) {  
    if (optionSelector==='*') {
      // When overwriting, modify this code snippet related to the unfiltered 
      // query to include the necessary related models. in this case 
      // returning [ related model 1, related model 2, ...]
      return [];
    }
    return []; // By default, no template is included
  }

  // Method to create filter from req.body
  getFilter(req, optionSelector = null) {
     return { 
      success: true, 
      message: '', 
      data: {}, 
      unexpected: false  
    };
  }

  async create(req, res) {
    let transaction;
    let dataPipe;
    let validationResult
    let createResult
    let preCreateResult
    let posCreateResult
    try {
      dataPipe = this.getDataFromRequest(req, 'create')
    
      validationResult  = await this.dataValidations(dataPipe)
      console.log('validation',validationResult)
      if (!validationResult.success) {
        const statusCode = validationResult.unexpected ? 500 : 400;
        return res.status(statusCode).json({ 
          message: validationResult.message,
          error: validationResult.error 
         });
      }

      transaction = await this.repository.transaction();

      // Executing pre create procedure
      preCreateResult = await this.preCreate(dataPipe, transaction)
      console.log('preCreateResult',preCreateResult)
      if (!preCreateResult.success) {
        if (transaction && !transaction.finished) {
          await transaction.rollback();
        }
        console.log('preCreateResult deu insucesso')
        const statusCode = preCreateResult.unexpected ? 500 : 400;
        return res.status(statusCode).json({ 
          message: `pre create ${this.repository.modelName}: `+
            preCreateResult.message, 
          error: preCreateResult.error 
        });
      }

      createResult = await this.repository.create(dataPipe, transaction )
      if (!createResult.success) {
        if (transaction && !transaction.finished) {
          await transaction.rollback();
        }
        const statusCode = createResult.unexpected ? 500 : 400;
        return res.status(statusCode).json({ 
          message: `create ${this.repository.modelName}: `+
                   createResult.message, 
          error: createResult.error 
        });
      }
      console.log('dataPipe1', dataPipe)
      dataPipe[this.modelName] = createResult.data;
      console.log('dataPipe2', dataPipe)

      // Executing pos create procedure
      posCreateResult = await this.posCreate(dataPipe, transaction)
      console.log('posCreateResult',posCreateResult)
      if (!posCreateResult.success) {
        if (transaction && !transaction.finished) {
          await transaction.rollback();
        }
        console.log('posCreateResult deu insucesso')
        const statusCode = posCreateResult.unexpected ? 500 : 400;
        return res.status(statusCode).json({ 
          message: `pos create ${this.repository.modelName}: `+
            posCreateResult.message, 
          error: posCreateResult.error 
        });
      }
      if (transaction && !transaction.finished) {
        await transaction.commit();
      }
      return res.status(201).json({
        message: joinTextsWithSeparator([
          createResult.message, 
          posCreateResult.message
        ]),
        data: { 
          ...createResult.data, 
          data: { ...posCreateResult.data }
        },
        unexpected: false,
      })
    } catch (error) {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
      this.showError(error, { 
        ...dataPipe,
        validationResult,
        createResult,
        posCreateResult
      })
      return res.status(500).json({ message: error.message, unexpected: true });
    }
  }

  async update (req, res) {
    console.log('UPDATE')
    let transaction;
    let dataPipe;
    let validationResult
    let updateResult
    let preUpdateResult
    let posUpdateResult
    try {

      dataPipe = this.getDataFromRequest(req, 'update')

      validationResult  = await this.dataValidations(dataPipe)
      if (!validationResult.success) {
        const statusCode = validationResult.unexpected ? 500 : 400;
        return res.status(statusCode).json({ 
          message: validationResult.message, 
          error: validationResult.error 
        });
      }
      transaction = await this.repository.transaction();

      // Executing pre update procedure
      preUpdateResult = await this.preUpdate(dataPipe, transaction)
      console.log('preUpdateResult',preUpdateResult)
      if (!preUpdateResult.success) {
        if (transaction && !transaction.finished) {
          await transaction.rollback();
        }
        console.log('preUpdateResult deu insucesso')
        const statusCode = preUpdateResult.unexpected ? 500 : 400;
        return res.status(statusCode).json({ 
          message: `pre update ${this.repository.modelName}: `+
            preUpdateResult.message, 
          error: preUpdateResult.error 
        });
      }

      updateResult = await this.repository.update(dataPipe, transaction);
      if (!updateResult.success) {
        if (transaction && !transaction.finished) {
          await transaction.rollback();
        }
        const statusCode = updateResult.unexpected ? 500 : 400;
        return res.status(statusCode).json({ 
          message: updateResult.message, 
          error: updateResult.error 
         });
      }
      // Executing pos update procedure
      posUpdateResult = await this.posUpdate(dataPipe, transaction)
      if (!posUpdateResult.success) {
        if (transaction && !transaction.finished) {
          await transaction.rollback();
        }
        const statusCode = posUpdateResult.unexpected ? 500 : 400;
        return res.status(statusCode).json({ 
          message: joinTextsWithSeparator([
            updateResult.message, 
            posUpdateResult.message
          ]),
          data: { 
              ...updateResult.data, 
              data: { ...posUpdateResult.data }
          },
          error: posUpdateResult.error 
        });
      }

      if (transaction && !transaction.finished) {
        await transaction.commit();
      }
      return res.json({ 
        message: updateResult.message, 
        data: updateResult.data, 
        error: updateResult.error  
      })
    } catch (error) {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
      this.showError(error, {
        ...dataPipe,
        validationResult,
        updateResult,
        posUpdateResult
      })
      return res.status(400).json({ message: error.message, unexpected: true  });
    }

  }

  async delete (req, res) {
    let dataPipe
    let transaction
    let findResult
    let freeResult
    let deleteResult
    let preDeleteResult
    let posDeleteResult
    try {
      dataPipe = this.getDataFromRequest(req, 'delete')
      findResult = await this.repository.findById(dataPipe.id);
      if (!findResult.success) {
        const statusCode = findResult.unexpected ? 500 : 400;
        return res.status(statusCode).json({ 
          message: findIdResult.message,
          error: findIdResult.error
        });
      }   

      dataPipe = { ...findResult.data, ...dataPipe };

      transaction = await this.repository.transaction();  
      
      // Executing pre delete procedure
      preDeleteResult = await this.preDelete(dataPipe, transaction)
      console.log('preDeleteResult',preDeleteResult)
      if (!preDeleteResult.success) {
        if (transaction && !transaction.finished) {
          await transaction.rollback();
        }
        console.log('preDeleteResult deu insucesso')
        const statusCode = preDeleteResult.unexpected ? 500 : 400;
        return res.status(statusCode).json({ 
          message: `pre delete ${this.repository.modelName}: `+
            preDeleteResult.message, 
          error: preDeleteResult.error 
        });
      }
      console.log('Antes deleteResult')
      deleteResult = await this.repository.delete(dataPipe.id, transaction);
      console.log('Depois deleteResult',deleteResult)
      if (!deleteResult.success) {
        if (transaction && !transaction.finished) {
          await transaction.rollback();
        }
        const statusCode = deleteResult.unexpected ? 500 : 400;
        return res.status(statusCode).json({ 
          message: deleteResult.message,
          error: deleteResult.error 
        });
      }

      // Executing pos delete procedure
      posDeleteResult = await this.posDelete(dataPipe, transaction)
      if (!posDeleteResult.success) {
        if (transaction && !transaction.finished) {
          await transaction.rollback();
        }
        const statusCode = posDeleteResult.unexpected ? 500 : 400;
        return res.status(statusCode).json({ 
          message:  joinTextsWithSeparator([
            deleteResult.message, 
            posDeleteResult.message
          ]),
          data: { 
              ...findResult.data, 
              data: { ...posDeleteResult.dataPipe }
          },
          error: posDeleteResult.error 
        });
      }

      if (transaction && !transaction.finished) {
        await transaction.commit();
      }
      return res.json({ 
        message: deleteResult.message, 
        data: findResult.data, 
        error: deleteResult.error
      })

    } catch (error) {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
      this.showError(error, {
        findResult,
        freeResult,
        deleteResult
      })
      return res.status(500).json({ message: error.message, unexpected: true  });
    }
  }

  async getById(req, res) {
    let findResult
    try {
      const { id } = req.params;
      const modelsToInclude = this.getModelsToInclude('.')
      findResult = await this.repository.findById(id, modelsToInclude);
      if (!findResult.success) {
        const statusCode = findResult.unexpected ? 500 : 400;
        return res.status(statusCode).json({ 
          message: findResult.message,
          error: findResult.error
        });
      }
      return res.json({ 
        message: findResult.message, 
        data: findResult.data,
        error: findResult.error 
      });
    } catch (error) {
      this.showError(error, {findResult})
      return res.status(500).json({ message: error.message, unexpected: true });
    }
  }
  
  async getAll(req, res, optionSelector = null) {
    let findResult

    let safeOptionSelector;
    if (optionSelector === null || 
        optionSelector === undefined || 
        typeof optionSelector === 'function') {
      safeOptionSelector = '*'; // Set to null for null, undefined, or functions
    } else if (typeof optionSelector === 'number' || 
               typeof optionSelector === 'string' || 
               typeof optionSelector === 'boolean') {
      safeOptionSelector = optionSelector; // Keep primitives as is
    } else {
      throw new Error('Invalid type of optionSelector parameter in getAll method');
    }
 
    try {
      // Get related models to include in the query
      const modelsToInclude = this.getModelsToInclude(safeOptionSelector)
 
      // Generate the filter object based on the request and optionSelector
      const filterResult = safeOptionSelector==='*'
          ? { success: true, message: '', data: {}, unexpected: false }
          : this.getFilter(req, safeOptionSelector)
      if (!filterResult.success) {
        const statusCode = filterResult.unexpected ? 500 : 400;
        return res.status(statusCode).json({ 
          message: filterResult.message,
          error: filterResult.error
        });
      }
      const filter = filterResult.data;

      // Determine pagination parameters: page number and page size
      // pageNumber default 0 if not provided, means that pagination will not be necessary
      const pageNumber = parseInt(req.body['pagenumber'], 10) ||
                         parseInt(req.query.pagenumber, 10) || 0; 
      const pageSize = parseInt(req.body['pagesize'], 10) ||
                       parseInt(req.query.pagesize, 10) || 
                       parseInt(process.env.PAGE_SIZE, 10); // Default to env value
      const offset = (pageNumber - 1) * pageSize; // Calculate the offset for pagination

      // Fetch the filtered records using pagination
      findResult = pageNumber===0 
        ? await this.repository.findAll(filter,modelsToInclude)
        : await this.repository.findAll(filter,modelsToInclude,offset,pageSize);
      if (!findResult.success) {
        const statusCode = findResult.unexpected ? 500 : 400;
        return res.status(statusCode).json({ 
          message: findResult.message,
          error: findResult.error
        });
      }
      return res.status(201).json({ 
        message: findResult.message, 
        data: findResult.data,
        error: findResult.error
      });
    } catch (error) {
      this.showError(error, {findResult})
      return res.status(500).json({ message: error.message, unexpected: true  });
    }
  }



  getDataFromRequest(req, actionName) {
    let extractedData

    const noPKFields = this.repository.getFieldsExcludingPrimaryKey()
    const extraFields = this.getExtraFieldsNames(actionName.toUpperCase())
    const toBeExtracted = actionName.toUpperCase() !== 'DELETE' 
    ? [...noPKFields, ...extraFields]
    : [...extraFields]  
    extractedData = this.extractFields(toBeExtracted,req.body)
    extractedData[actionName.toUpperCase()] = true;
    extractedData=this.addFields(req.Body, extractedData)
    const { id } = req.params;
    if (id) {
      const parsedId = parseInt(id, 10); // Converte para número inteiro
      if (isNaN(parsedId)) {
        throw new Error('Invalid id: id must be an integer');
      }
      extractedData['id'] = parsedId;
      extractedData[this.repository.getPrimaryKey()] = parsedId;
    }

    return extractedData
  }


}

module.exports = BaseController;