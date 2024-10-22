'use strict';
module.exports = (sequelize, DataTypes) => {
  const State = sequelize.define('State', {
    ID_State: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    Name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    Acronym: {
      type: DataTypes.STRING(2),
      allowNull: false,
      unique: true,
    },
    Cod_State: {
      type: DataTypes.STRING(2),
      allowNull: false,
      unique: true,
    }
  }, {
    timestamps: false, 
  });

  State.associate = (db) => {
    State.hasMany(db.City, { foreignKey: 'ID_State' });
  };

  return State;
};