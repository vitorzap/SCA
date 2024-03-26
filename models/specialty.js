module.exports = (sequelize, DataTypes) => {
  const Specialty = sequelize.define('Specialty', {
    ID_Company: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Companies',
        key: 'ID_Company'
      }
    },    
    ID_Specialties: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    Description: {
      type: DataTypes.STRING(100),
      allowNull: false
    }
  }, {
    timestamps: false,
    tableName: 'Specialties'
  });

  return Specialty;
};
