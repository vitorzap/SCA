// repositories/appointmentRepository.js
const { Appointment } = require('../models');

class AppointmentRepository {
  async findByClientId(ID_Client) {
    return await Appointment.findAll({ where: { ID_Client } });
  }
}

module.exports = new AppointmentRepository();