class ModelService {
  constructor(db) {
    this.db = db;
  }

  getFields(modelName) {
    if (!this.db[modelName]) throw new Error(`Model '${modelName}' not found.`);
    return Object.keys(this.db[modelName].rawAttributes);
  }

  getFieldsExcludingPK(modelName) {
    if (!this.db[modelName]) throw new Error(`Model '${modelName}' not found.`);
    return Object.keys(this.db[modelName].rawAttributes).filter(
      (key) => !this.db[modelName].rawAttributes[key].primaryKey &&
               !['createdAt', 'updatedAt', 'deletedAt'].includes(key)
    );
  }

  getPrimaryKey(modelName) {
    if (!this.db[modelName]) throw new Error(`Model '${modelName}' not found.`);
    
    const model = this.db[modelName];
    const primaryKey = Object.keys(model.rawAttributes).find(
      (key) => model.rawAttributes[key].primaryKey
    );

    if (!primaryKey) throw new Error(`Primary key not found for model '${modelName}'.`);
    
    return primaryKey;
  }

  getAttributes(modelName) {
    if (!this.db[modelName]) throw new Error(`Model '${modelName}' not found.`);
    return this.db[modelName].rawAttributes;
  }
}

module.exports = ModelService;