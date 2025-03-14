const { validateData, getBaseSchema } = require ('../utils/validation/yupHelpers')


class BaseModelService {
  constructor(repository) {
    if (!repository) throw new Error('Repository must be provided.');
    this.repository = repository;
  }

  getDataFromRequest(req, actionName) {
    let extractedData

    const noPKModelFields = this.repository.getFieldsExcludingPrimaryKey()
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

  // getExtraField - This function can be overridden.
  // Use this function to provide the names of the fields that the request
  // may contain and that are not obtained through standard processing but 
  // will also be used in processing your request. The “actionName” parameter 
  // allows differentiating responses for different action cases.
  getExtraFieldsNames(actionNamen) {
    const action = actionName.toUpperCase();
    if (action === 'CREATE') {
      return [];
    } else if (action === 'UPDATE') {
      return [];
    } else if (action === 'DELETE') {
      return [];
    }
    throw new Error(`Unknown action '${actionName}' provided to function getExtraFieldsNames.`);
  }

  // getExtraField - This function can be overridden.
  // If there are fields that need to be obtained through calculations, 
  // queries, or other types of derivation before processing the request data, 
  // do it here.
  addFields(reqbody, obj = {}) {
    // if (reqbody.xxxx && reqbody.yyyyy) {
    //   campo =  xxxx + yyyyy;
    // }
    return obj;
  }


  async validateData(data) {
    let result
    try {
      let dataToBeVerified = { ...data };

      const primaryKey = this.repository.getPrimaryKey();
      if (dataToBeVerified[primaryKey]) {
        result = await this.repository.findById(dataToBeVerified[primaryKey]);
        if (!findResult.success) {
          return result;
        }
        dataToBeVerified = { ...result.data, ...dataToBeVerified };
      }
      validationSchema = getBaseSchema()


      *******
    }
  



    return { success: true, message: '', unexpected: false };
  }

  async create(data) {
    let transaction;
    let dataMerged;
    let result;

    dataMerged = this.getDataFromRequest(req, 'create')
    result = await this.validateData(dataMerged);
    if (!validation.success) return validation;

    const preCreate = await this.preCreate(data);
    if (!preCreate.success) return preCreate;

    const created = await this.repository.create(data);
    if (!created.success) return created;

    const postCreate = await this.posCreate(created.data);
    return postCreate.success ? created : postCreate;
  }

  async update(data) {
    const validation = await this.validateData(data);
    if (!validation.success) return validation;

    const preUpdate = await this.preUpdate(data);
    if (!preUpdate.success) return preUpdate;

    const updated = await this.repository.update(data);
    if (!updated.success) return updated;

    const postUpdate = await this.posUpdate(updated.data);
    return postUpdate.success ? updated : postUpdate;
  }

  async delete(id) {
    const preDelete = await this.preDelete(id);
    if (!preDelete.success) return preDelete;

    const deleted = await this.repository.delete(id);
    if (!deleted.success) return deleted;

    const postDelete = await this.posDelete(id);
    return postDelete.success ? deleted : postDelete;
  }

  async preCreate() { return { success: true, message: '', unexpected: false }; }
  async posCreate() { return { success: true, message: '', unexpected: false }; }
  async preUpdate() { return { success: true, message: '', unexpected: false }; }
  async posUpdate() { return { success: true, message: '', unexpected: false }; }
  async preDelete() { return { success: true, message: '', unexpected: false }; }
  async posDelete() { return { success: true, message: '', unexpected: false }; }
}

module.exports = BaseService;