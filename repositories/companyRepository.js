
const BaseRepository = require('./baseRepository'); 

class CompanyRepository extends BaseRepository {
  constructor({ db }) {
    super('Company',db); // Passa o modelo State para o repositório base
  }

  // Adicione métodos específicos do State, se necessário
}

module.exports =  CompanyRepository ;  