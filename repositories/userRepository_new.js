const { User } = require('../models'); 
const BaseRepository = require('./baseRepository'); 

class UserRepository extends BaseRepository {
  constructor() {
    super(User); // Passa o modelo State para o repositório base
  }

  // Adicione métodos específicos do User, se necessário
}

module.exports = new UserRepository(); 