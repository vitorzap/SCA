class CustomError extends Error {
  constructor({ message, unexpected = false, data = null }) {
    super(message);  
    this.name = "CustomError";  
    this.unexpected = unexpected;  
    this.data = data;  
  }
}

module.exports = CustomError;