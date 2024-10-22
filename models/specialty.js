'use strict';
module.exports = (sequelize, DataTypes) => {
  const Specialty = sequelize.define('Specialty', {
    ID_Specialties: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    Description: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    ID_Company: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Companies',
        key: 'ID_Company'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT'
    }
  },  {
    timestamps: false,
  });

  Specialty.associate = (db) => {
    Specialty.belongsTo(db.Company, { foreignKey: 'ID_Company' });
    Specialty.hasMany(db.ProfessionalSpecialty, { foreignKey: 'ID_Specialties' });
    Specialty.hasMany(db.RegularSchedule, { foreignKey: 'ID_Specialty' });
    Specialty.hasMany(db.Appointment, { foreignKey: 'ID_Specialty' });
  };

  return Specialty;
};