// State model
module.exports = (sequelize, DataTypes) => {
  const State = sequelize.define('State', {
    ID_State: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    Name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    Acronym: {
      type: DataTypes.STRING(2),
      allowNull: false,
      unique: true
    },
    Cod_State: {
      type: DataTypes.STRING(2),
      allowNull: false,
      unique: true
    }
  }, {
    timestamps: false,
    tableName: 'States'
  });

  return State;
};