const { createContainer, asClass, asValue, asFunction, InjectionMode } = require('awilix');
const yup = require('yup');
const path = require('path');
const db = require('./models'); 
//
const  StateRepository  = require('./repositories/stateRepository');
const  StateController  = require('./controllers/stateController');
const  StateValidationService  = require('./services/validationService/stateValidationService');
const  CityRepository  = require('./repositories/cityRepository');
const  CityController  = require('./controllers/cityController');
const  CompanyRepository  = require('./repositories/companyRepository');
const  CompanyController  = require('./controllers/companyController');

const  UserRepository = require('./repositories/userRepository');
const  UserTypeRepository = require('./repositories/userTypeRepository');
const  ModelService = require('./services/modelService');

const DataMergeService = require('./services/dataMergeService');
const DataMergeHelper = require('./utils/helpers/dataMergeHelper'); 

const ValidationHelper = require('./utils/helpers/validationHelper');


// Create the container
const container = createContainer({
  injectionMode: InjectionMode.PROXY
});

// Dependency registration
container.register({
  // Controllers
  stateController: asClass(StateController).scoped(),
  cityController: asClass(CityController).scoped(),
  companyController: asClass(CompanyController).scoped(),


  // Repositories
  stateRepository: asClass(StateRepository).singleton(),
  cityRepository: asClass(CityRepository).singleton(),
  companyRepository: asClass(CompanyRepository).singleton(),
  userRepository: asClass(UserRepository).singleton(),
  userTypeRepository: asClass(UserTypeRepository).singleton(),

  // Services
  modelService: asClass(ModelService).singleton(),
  dataMergeService: asClass(DataMergeService).singleton(),

  //Validation services
  stateValidationService: asClass(StateValidationService).singleton(),
  
  // Utils (helpers)
  filterHelpers: asFunction(require('./utils/filter/filterHelpers')).singleton(),
  
  // Others
  db: asValue(db), // Database Connection
  yup: asValue(yup), 
  userHelpers: asValue(require('./utils/user/userHelpers')),
  dataMergeHelper: asValue(DataMergeHelper),
  validationHelper: asValue(ValidationHelper)
});


module.exports = container;