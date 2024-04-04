module.exports = (sequelize, DataTypes) => {
  const Teacher = sequelize.define('Teacher', {
    ID_Company: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Companies',
        key: 'ID_Company'
      }
    },    
    ID_Teacher: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    UserID: { // Este campo é adicionado para associar diretamente o Cliente a um Professor
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true, // Garante que cada professor esteja associado a um único usuário
      references: {
        model: 'Users', // Indica que este campo é uma chave estrangeira que aponta para a tabela Users
        key: 'UserID'
      }
    },
    Name: {
      type: DataTypes.STRING(100),
      allowNull: false
    }
  }, {
    timestamps: false,
    tableName: 'Teachers'
  });

  return Teacher;
};

