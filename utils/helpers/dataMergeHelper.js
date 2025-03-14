class DataMergeHelper {
  setResultingFields(dataMerged, otherParams =  {}) {
    // Here we can create new fields through calculations, 
    // formatting and transformations of data in the dataMerged 
    // and add to it. 
    // ex:   dataMerged.newField1 =  dataMerged.X + dataMerged.Y;
    //       dataMerged.newField2 = dataMerged.Z.toUpperCase();
    // Other parameters could be for example an object containing 
    // properties such as repositories and/or services to be used 
    // to add data to dataMerged
    // Example: If `stateRepository` is present, fetch the state
    // to get its name
    // if (otherParams.stateRepository && dataMerged.Cod_State) {
    //   const state = otherParams.stateRepository.findById(dataMerged.Cod_State);
    //   if (state.success) {
    //     dataMerged.StateName = state.data.Name;
    //   }
    // }
    return dataMerged
  }

  static removeFields(dataMerged) {
    // Se precisar retirar campos de dataMerged faça aqui
    // Ex:  delete dataMerged['Password']); 
    return dataMerged;
  }
}

module.exports = { 
  setResultingFields: (dataMerged, otherParams) => 
    new DataMergeHelper().setResultingFields(dataMerged, otherParams),
  removeFields: (dataMerged) => 
    new DataMergeHelper().removeFields(dataMerged)
};