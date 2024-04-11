

// Nome do arquivo: models/associations.js
// models/associations.js
const { Company, User, Client, Teacher, Specialty, TimeTable, City, State } = require('./'); 

// Associações de company
// Relações de 1:N 
Company.hasMany(Client, { foreignKey: 'ID_Company' });
Client.belongsTo(Company, { foreignKey: 'ID_Company' });
//
Company.hasMany(Teacher, { foreignKey: 'ID_Company' });
Teacher.belongsTo(Company, { foreignKey: 'ID_Company' });
//
Company.hasMany(Specialty, { foreignKey: 'ID_Company' });
Specialty.belongsTo(Company, { foreignKey: 'ID_Company' });
//
Company.hasMany(TimeTable, { foreignKey: 'ID_Company' });
TimeTable.belongsTo(Company, { foreignKey: 'ID_Company' });
//
Company.hasMany(User, { foreignKey: 'ID_Company' });
User.belongsTo(Company, { foreignKey: 'ID_Company' });
//

// Associações de user
// Relação 1 x 1 User x Client
User.hasOne(Client,{  foreignKey: 'UserID',  as: 'clientInfo', onDelete: 'RESTRICT'});
// Relação 1 x 1 User x Teacher
User.hasOne(Teacher,{  foreignKey: 'UserID',  as: 'teacherInfo', onDelete: 'RESTRICT'});


// Associações de teachers
// Define associations N x N => Teacher x Specialty
Teacher.belongsToMany(Specialty, { through: 'TeacherSpecialties', foreignKey: 'ID_Teacher' });
Specialty.belongsToMany(Teacher, { through: 'TeacherSpecialties', foreignKey: 'ID_Specialties' });

// Relações de 1:N  teacher 1 x timeTable N
Teacher.hasMany(TimeTable, { foreignKey: 'ID_Teacher' });
TimeTable.belongsTo(Teacher, { foreignKey: 'ID_Teacher' });

// Relações de 1:N Specialty 1 x timeTable N
Specialty.hasMany(TimeTable, { foreignKey: 'ID_Specialty' });
TimeTable.belongsTo(Specialty, { foreignKey: 'ID_Specialty' });

// Relações de N:N TimeTable x Client 
TimeTable.belongsToMany(Client, { through: 'TimeTableClients', foreignKey: 'ID_TimeTable' });
Client.belongsToMany(TimeTable, { through: 'TimeTableClients', foreignKey: 'ClientID' });


// Associações de City(Cidade)
// Relações de 1:N  City 1 x  N  Cliente
Client.belongsTo(City, {foreignKey: 'ID_City'});
City.hasMany(Client, {foreignKey: 'ID_City'});

// Associações de State(Estado)
// Relações de 1:N  State 1 x  N City
City.belongsTo(State, {foreignKey: 'ID_State'});
State.hasMany(City, {foreignKey: 'ID_State'});
 

// Nome do arquivo: models/city.js
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

// Nome do arquivo: models/client.js
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


// Nome do arquivo: models/company.js
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


// Nome do arquivo: models/index.js
'use strict'; 
console.log('MODEL INDEX.JS ==>> INICIANDO')

const Sequelize = require('sequelize');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables from .env file

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.json')[env];

// Creating a new Sequelize instance using our configuration
const sequelize = new Sequelize(config.database, config.username, config.password, config);

const db = {};

// Reading all the model files in the directory
fs.readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && 
           (file !== path.basename(__filename)) && 
           (file.slice(-3) === '.js') &&
           (file.indexOf('associations.js') === -1);
  })
  .forEach(file => {
    console.log(`INICIANDO MODEL(${path.join(__dirname, file)})`)
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Checking model associations
// Object.keys(db).forEach(modelName => {
//   if (db[modelName].associate) {
//     db[modelName].associate(db);
//   }
// });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;


// Nome do arquivo: models/specialty.js
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


// Nome do arquivo: models/state.js
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

// Nome do arquivo: models/teacher.js
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



// Nome do arquivo: models/timeTable.js
module.exports = (sequelize, DataTypes) => {
  const TimeTable = sequelize.define('TimeTable', {
    ID_Company: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Companies',
        key: 'ID_Company'
      }
    },    
    ID_TimeTable: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    ID_Teacher: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Teachers', // Make sure this matches your actual Teacher table name
        key: 'ID_Teacher'
      }
    },
    ID_Specialty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Specialties', // Garanta que isso corresponde ao nome da tabela de Specialty
        key: 'ID_Specialties'
      }
    },
    Day_of_Week: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    Start_Time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    End_Time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    Capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1 // Ensures capacity is never zero or negative
      }
    },
    Available_Capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0, // Set to 0 as per requirements
      validate: {
        min: 0 // Ensures available capacity is never negative
      }
    }
  }, {
    tableName: 'TimeTables',
    timestamps: false
  });

  TimeTable.addHook('beforeValidate', (timeTable, options) => {
    if (timeTable.Capacity < timeTable.Available_Capacity) {
      throw new Error('Available capacity cannot exceed total capacity.');
    }
  });

  return TimeTable;
};



// Nome do arquivo: models/timeTableClients.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const TimeTableClients = sequelize.define('TimeTableClients', {
    // Se necessário, você pode adicionar colunas adicionais aqui
    ID_TimeTable: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'TimeTable', // Nome do modelo TimeTable
        key: 'id'
      }
    },
    ClientID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Client', // Nome do modelo Client
        key: 'id'
      }
    }
  });

  return TimeTableClients;
};


// Nome do arquivo: models/user.js
// models/user.js
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    ID_Company: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Companies',
        key: 'ID_Company'
      }
    },
    UserID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    UserName: {
      type: DataTypes.STRING(30),
      allowNull: false
    },
    UserEmail: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    UserPassword: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    UserType: {
      type: DataTypes.ENUM('Root', 'Admin', 'Teacher', 'Client'),
      allowNull: false
    },
  }, {
    timestamps: false,
    tableName: 'Users'
  });

  return User;
};
