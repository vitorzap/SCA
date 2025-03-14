// Description: Validation helper functions.

class ValidationHelper {
  constructor() {
    this.validateEmail = this.validateEmail.bind(this);
  }
  
  validateEmail(email) {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  }
}

module.exports = { 
  validateEmail: (email) => 
    new ValidationHelper().validateEmail(email)
};
