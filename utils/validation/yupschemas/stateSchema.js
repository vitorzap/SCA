const yup = require('yup');

const stateSchema = yup.object().shape({
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

  ID_State: yup.number().integer().test(
    'id-state-required',
    'ID_State is mandatory for update actions',
    function (value) {
      const { action } = this.parent;
      if (action === 'CREATE') return value === undefined;
      if (action === 'UPDATE') return value !== undefined;
      return true;
    }
  ),
  Name: yup.string().required().max(100),
  Acronym: yup.string().required().max(2),
  Cod_State: yup.number().required().integer(),
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

  ID_City: yup
    .number()
    .integer()
    .required('ID_City is required for DELETE'),
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