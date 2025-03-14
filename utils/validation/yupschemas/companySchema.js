const yup = require('yup');

const createUpdateSchema = yup.object().shape({
  action: yup
    .string()
    .oneOf(['CREATE', 'UPDATE'], 'Action must be CREATE or UPDATE')
    .required('Action is required'),
  id: yup
    .number()
    .integer()
    .test(
      'id-required',
      'ID is mandatory for UPDATE actions and must not be present in CREATE actions',
      function (value) {
        const { action } = this.parent;
        if (action === 'CREATE') return value === undefined;
        if (action === 'UPDATE') return value !== undefined;
        return true;
      }
    ),

  ID_City: yup
    .number()
    .integer()
    .test(
      'id-company-required',
      'ID_Company is mandatory for UPDATE actions and must not be present in CREATE actions',
      function (value) {
        const { action } = this.parent;
        if (action === 'CREATE') return value === undefined;
        if (action === 'UPDATE') return value !== undefined;
        return true;
      }
    ),
  Name: yup.string().max(255, 'Name must be at most 255 characters long').required('Name is required'),
  AdminEmail: yup.string().test(
    'is-required-and-valid-if-create',
    'AdminEmail must be a valid email address and is required when action is CREATE',
    function (value) {
      const { action } = this.parent;
      if (action === 'CREATE') {
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
});


const deleteSchema = yup.object().shape({
  action: yup
    .string()
    .oneOf(['DELETE'], 'Action must be DELETE')
    .required('Action is required'),
  id: yup
    .number()
    .integer()
    .required('ID is required for DELETE'),
  ID_Company: yup
    .number()
    .integer()
    .required('ID_Company is required for DELETE'),
});

const querySchema = yup.object().shape({
  action: yup
    .string()
    .oneOf(['QUERY'], 'Action must be QUERY')
    .required('Action is required'),

  pageNumber: yup
    .number()
    .integer()
    .when('pageSize', {
      is: (val) => val !== undefined, // Se pageSize for fornecido
      then: yup.number().integer().required('pageNumber is required when pageSize is provided'),
      otherwise: yup.number().integer().notRequired(),
    }),

  pageSize: yup
    .number()
    .integer()
    .when('pageNumber', {
      is: (val) => val !== undefined, // Se pageNumber for fornecido
      then: yup.number().integer().required('pageSize is required when pageNumber is provided'),
      otherwise: yup.number().integer().notRequired(),
    }),
});

const schemas = {
  CREATE: createUpdateSchema,
  UPDATE: createUpdateSchema,
  DELETE: deleteSchema,
  QUERY: querySchema, 
};

module.exports = schemas;