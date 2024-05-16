const Appointment = sequelize.define('Appointment', {
  ID_Appointment: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ID_RegularSchedule: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'RegularSchedules',
      key: 'ID_RegularSchedule'
    }
  },
  ID_Company: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Companies',
      key: 'ID_Company'
    }
  },
  ID_Teacher: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Teachers',
      key: 'ID_Teacher'
    }
  },
  ID_Specialty: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Specialties',
      key: 'ID_Specialties'
    }
  },
  ClientID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Clients',
      key: 'ClientID'
    }
  },
  Date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  Start_Time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  End_Time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  Status: {
    type: DataTypes.ENUM,
    values: ['scheduled', 'performed', 'canceled'],
    allowNull: false,
    defaultValue: 'scheduled'
  }
}, {
  tableName: 'Appointments',
  timestamps: false
});
