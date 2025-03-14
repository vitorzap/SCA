
const BaseRepository = require('./baseRepository'); 

class CityRepository extends BaseRepository {
  constructor({ db }) {
    super('City', db); // Passa o modelo State para o repositório base
  }

  // Adicione métodos específicos do State, se necessário
}

module.exports = CityRepository;