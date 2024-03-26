// models/company.js
module.exports = (sequelize, DataTypes) => {
  const Company = sequelize.define('Company', {
    ID_Company: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    Name: {
      type: DataTypes.STRING,
      allowNull: false
    }
    // Outros campos relevantes para uma companhia, como endereço, CNPJ, etc.
  }, {
    tableName: 'Companies',
    timestamps: false
  });

  return Company;
};
