'use strict';
module.exports = (sequelize, DataTypes) => {
  const Professional = sequelize.define('Professional', {
    ID_Professional: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    Name: {
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
    },
    ID_User: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'ID_User'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    }
  },  {
    timestamps: false,
  });

  Professional.associate = (db) => {
    Professional.belongsTo(db.Company, { foreignKey: 'ID_Company' });
    Professional.belongsTo(db.User, { foreignKey: 'ID_User' });
    Professional.hasMany(db.ProfessionalSpecialty, { foreignKey: 'ID_Professional' });
    Professional.hasMany(db.RegularSchedule, { foreignKey: 'ID_Professional' });
    Professional.hasMany(db.Appointment, { foreignKey: 'ID_Professional' });
  };

  return Professional;
};