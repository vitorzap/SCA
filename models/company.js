'use strict';
module.exports = (sequelize, DataTypes) => {
  const Company = sequelize.define('Company', {
    ID_Company: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    Name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    }
  },  {
    timestamps: false,
  });
  
  Company.associate = (db) => {
    Company.hasMany(db.User, { foreignKey: 'ID_Company' });
    Company.hasMany(db.Professional, { foreignKey: 'ID_Company' });
    Company.hasMany(db.Client, { foreignKey: 'ID_Company' });
    Company.hasMany(db.Specialty, { foreignKey: 'ID_Company' });
    Company.hasMany(db.RegularSchedule, { foreignKey: 'ID_Company' });
  };

  return Company;
};