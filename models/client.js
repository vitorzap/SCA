//
module.exports = (sequelize, DataTypes) => {
  const Client = sequelize.define('Client', {
    ID_Company: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Companies',
        key: 'ID_Company'
      }
    },    
    ClientID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    UserID: { // Este campo é adicionado para associar diretamente o Cliente a um Usuário
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true, // Garante que cada cliente esteja associado a um único usuário
      references: {
        model: 'Users', // Indica que este campo é uma chave estrangeira que aponta para a tabela Users
        key: 'UserID'
      }
    },
    Name: {
      type: DataTypes.STRING(80),
      allowNull: false
    },
    Email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    Phone: {
      type: DataTypes.STRING(20),
      allowNull: true // Assuming phone can be optional
    },
    DateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true // Assuming date of birth can be optional
    },
    Gender: {
      type: DataTypes.ENUM('Male', 'Female', 'Other'),
      allowNull: true // Assuming gender can be optional
    },
    CPF: {
      type: DataTypes.STRING(11),
      allowNull: false,
      unique: true
    },
    Street: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    Complement: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    District: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    ID_City: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Cities',
        key: 'ID_City'
      }
    },
    CEP: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    RegistrationDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW // Automatically set to current date/time
    },
  }, {
    timestamps: false,
    tableName: 'Clients'
  });

  return Client;
};
