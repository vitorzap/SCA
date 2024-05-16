const RegularSchedule = sequelize.define('RegularSchedule', {
  ID_RegularSchedule: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
  Day_of_Week: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
      max: 6
    }
  },
  Start_Time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  End_Time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  Capacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1 // Ensures capacity is never zero or negative
    }
  },
  Available_Capacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0, // Set to 0 as per requirements
    validate: {
      min: 0 // Ensures available capacity is never negative
    }
  }
}, {
  tableName: 'RegularSchedules',
  timestamps: false
});
