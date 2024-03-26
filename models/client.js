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
    Address: {
      type: DataTypes.STRING(255),
      allowNull: true // Assuming address can be optional
    },
    City: {
      type: DataTypes.STRING(50),
      allowNull: true // Assuming city can be optional
    },
    State: {
      type: DataTypes.STRING(50),
      allowNull: true // Assuming state can be optional
    },
    CEP: {
      type: DataTypes.STRING(20),
      allowNull: true // Assuming CEP can be optional
    },
    DateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true // Assuming date of birth can be optional
    },
    Gender: {
      type: DataTypes.ENUM('Male', 'Female', 'Other'),
      allowNull: true // Assuming gender can be optional
    },
    RegistrationDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW // Automatically set to current date/time
    },
    LastPaymentDate: {
      type: DataTypes.DATE,
      allowNull: true // Assuming last payment date can be optional
    },
    TypePayment: {
      type: DataTypes.ENUM('Mensal', 'Trimestral', 'Semestral', 'Anual'),
      allowNull: true // Assuming payment type can be optional
    },
    Status: {
      type: DataTypes.ENUM('Active', 'Inactive', 'Suspended'),
      allowNull: false,
      defaultValue: 'Active' // Default status
    },
    PaymentMethod: {
      type: DataTypes.ENUM('Cartão Débito', 'Cartão Crédito', 'Cheque', 'Pré-Datado', 'PIX'),
      allowNull: true // Assuming payment method can be optional
    }
  }, {
    timestamps: false,
    tableName: 'Clients'
  });

  return Client;
};
