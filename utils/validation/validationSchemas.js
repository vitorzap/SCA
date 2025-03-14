const yup = require('yup');

const  stateSchema = yup.object().shape({
  ID_State: yup
    .number()
    .integer()
    .test(
      'id-state-required',
      'ID_State is mandatory for update and delete actions',
      function (value) {
        const { CREATE, UPDATE, DELETE } = this.parent;
        if (CREATE) {
          return value === undefined;
        }
        if (UPDATE || DELETE) {
          return value !== undefined;
        }
        return true;
      }
    ),
  Name: yup.string().required().max(100),
  Acronym: yup.string().required().max(2),
  Cod_State: yup.number().required().integer(),
});

const citySchema = yup.object().shape({
  ID_City: yup
    .number()
    .integer()
    .test(
      'id-city-required',
      'ID_City is mandatory for update and delete actions',
      function (value) {
        const { CREATE, UPDATE, DELETE } = this.parent;
        if (CREATE) {
          return value === undefined;
        }
        if (UPDATE || DELETE) {
          return value !== undefined;
        }
        return true;
      }
    ),
  Name: yup.string().required().max(100),
  Cod_State: yup.number().required().integer(),
  ID_State: yup.number().required().integer(),
  Cod_City: yup.number().required().integer(),
});

const companySchema = yup.object().shape({
  Name: yup
    .string()
    .max(255, 'Name must be at most 255 characters long')
    .required('Name is required'),
  AdminEmail: yup
    .string()
    .test(
      'is-required-and-valid-if-create',
      'AdminEmail must be a valid email address and is required when CREATE is true',
      function (value) {
        const { CREATE = false } = this.parent;
        if (CREATE) {
          return (
            value !== undefined &&
            value !== null &&
            value.trim() !== '' &&
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          );
        }
        return true;
      }
    ),
  CREATE: yup.boolean().default(false).oneOf([true, false], 'CREATE must be true or false'),
});


// Function to return the schema dictionary
function getValidationSchemas() {
  return {
    STATE: stateSchema,
    CITY: citySchema,
    COMPANY: companySchema,
  };
}

module.exports = getValidationSchemas;