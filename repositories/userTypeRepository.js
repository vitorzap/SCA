const { UserType } = require('../models'); 
const BaseRepository = require('./baseRepository'); 

class UserTypeRepository extends BaseRepository {
  constructor() {
    super(UserType); // Passa o modelo UserType para o repositório base
 
    this.findByTypeName = this.findByTypeName.bind(this)
    this.findByTypeLevel = this.findByTypeLevel.bind(this)
    this.findByTypeNameAndLevel = this.findByTypeNameAndLevel.bind(this)

  }

  // Adicione métodos específicos do UserType, se necessário
  // Find by TypeName
  async findByTypeName(TypeName) {
    const filter = { TypeName }; // Construção do filtro
    return await this.findAll(filter); // Reutiliza o método genérico
  }

  // Find by TypeLevel
  async findByTypeLevel(UserTypeLevel) {
    console.log('UserTypeLevel',UserTypeLevel)
    const filter = { UserTypeLevel }; // Construção do filtro
    return await this.findAll(filter); // Reutiliza o método genérico
  }

  // Find by TypeName and TypeLevel
  async findByTypeNameAndLevel(TypeName, UserTypeLevel) {
    const filter = { TypeName, UserTypeLevel }; // Construção do filtro combinado
    return await this.findAll(filter); // Reutiliza o método genérico
  }



}

module.exports = UserTypeRepository; 