// repositories/regularScheduleRepository.js
const { ClientRegularSchedule } = require('../models');

class RegularScheduleRepository {
  async findByClientId(ID_Client) {
    return await ClientRegularSchedule.findAll({ where: { ID_Client } });
  }
}

module.exports = new RegularScheduleRepository();