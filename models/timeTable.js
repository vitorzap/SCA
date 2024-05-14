
module.exports = (sequelize, DataTypes) => {
  const TimeTable = sequelize.define('TimeTable', {
    ID_Company: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Companies',
        key: 'ID_Company'
      }
    },    
    ID_TimeTable: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    ID_Teacher: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Teachers', // Make sure this matches your actual Teacher table name
        key: 'ID_Teacher'
      }
    },
    ID_Specialty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Specialties', // Garanta que isso corresponde ao nome da tabela de Specialty
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
    tableName: 'TimeTables',
    timestamps: false
  });

  TimeTable.addHook('beforeValidate', (timeTable, options) => {
    if (timeTable.Capacity < timeTable.Available_Capacity) {
      throw new Error('Available capacity cannot exceed total capacity.');
    }
  });

  return TimeTable;
};