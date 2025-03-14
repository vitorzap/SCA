const { UserType } = require('../models');

class UserTypeRepository {
  // Find by ID_UserType (Primary Key)
  async findById(ID_UserType) {
    return UserType.findByPk(ID_UserType);
  }

  // Find by TypeName
  async findByTypeName(TypeName) {
    return UserType.findOne({
      where: { TypeName }
    });
  }

  // Find by TypeLevel
  async findByTypeLevel(UserTypeLevel) {
    return UserType.findAll({
      where: { UserTypeLevel }
    });
  }

  // Find by TypeName and TypeLevel
  async findByTypeNameAndLevel(TypeName, UserTypeLevel) {
    return UserType.findOne({
      where: { TypeName, UserTypeLevel }
    });
  }

  // Find all UserTypes
  async findAll() {
    return UserType.findAll();
  }
}

module.exports = new UserTypeRepository();