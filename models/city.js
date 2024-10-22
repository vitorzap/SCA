'use strict';
module.exports = (sequelize, DataTypes) => {
  const City = sequelize.define('City', {
    ID_City: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    Name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    Cod_State: {
      type: DataTypes.STRING(2),
      allowNull: false,
    },
    Cod_City: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    ID_State: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'States',
        key: 'ID_State'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT'
    }
  }, {
    timestamps: false, 
  });

  City.associate = (db) => {
    City.belongsTo(db.State, { foreignKey: 'ID_State' });
    City.hasMany(db.Client, { foreignKey: 'ID_City' });
  };

  return City;
};