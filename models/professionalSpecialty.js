'use strict';
module.exports = (sequelize, DataTypes) => {
  const ProfessionalSpecialty = sequelize.define('ProfessionalSpecialty', {
    ID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    ID_Professional: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Professionals',
        key: 'ID_Professional'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT'
    },
    ID_Specialties: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Specialties',
        key: 'ID_Specialties'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT'
    }
  },  {
    timestamps: false,
  });

  ProfessionalSpecialty.associate = (db) => {
    ProfessionalSpecialty.belongsTo(db.Professional, { foreignKey: 'ID_Professional' });
    ProfessionalSpecialty.belongsTo(db.Specialty, { foreignKey: 'ID_Specialties' });
  };

  return ProfessionalSpecialty;
};