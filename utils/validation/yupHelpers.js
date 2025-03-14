const yup = require('yup');


async function validateData(data, schema) {
  try {
    console.log(data);
    await schema.validate(data, { abortEarly: false });
    return { success: true, message: '', unexpected: false };
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      const allMessages = error.inner.map(err => err.message).join('; ');
      return { success: false, message: allMessages, unexpected: false };
    }
    // For unexpected errors
    return {
      success: false,
      message: 'An unexpected error occurred during validation (' +
                error.message + ')',
      unexpected: true
    };
  }
}

function getBaseSchema() {
  return yup.object().shape({
    CREATE: yup
      .boolean()
      .test(
        'mutually-exclusive-create',
        'CREATE, UPDATE, and DELETE are mutually exclusive',
        function (value) {
          const { UPDATE, DELETE } = this.parent;
          return value ? !UPDATE && !DELETE : true;
        }
      ),
    UPDATE: yup
      .boolean()
      .test(
        'mutually-exclusive-update',
        'CREATE, UPDATE, and DELETE are mutually exclusive',
        function (value) {
          const { CREATE, DELETE } = this.parent;
          return value ? !CREATE && !DELETE : true;
        }
      ),
    DELETE: yup
      .boolean()
      .test(
        'mutually-exclusive-delete',
        'CREATE, UPDATE, and DELETE are mutually exclusive',
        function (value) {
          const { CREATE, UPDATE } = this.parent;
          return value ? !CREATE && !UPDATE : true;
        }
      ),
  });
}


module.exports = { yup, validateData, getBaseSchema };



