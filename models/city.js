// City model
module.exports = (sequelize, DataTypes) => {
  const City = sequelize.define('City', {
    ID_City: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    ID_State: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'States',
        key: 'ID_State'
      }
    },
    Name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    Cod_State: {
      type: DataTypes.STRING(2),
      allowNull: false
    },
    Cod_City: {
      type: DataTypes.STRING(10),
      allowNull: false
    }
  }, {
    timestamps: false,
    tableName: 'Cities'
  });

  return City;
};