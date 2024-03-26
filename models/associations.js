// models/associations.js
const { Company, User, Client, Teacher, Specialty, TimeTable  } = require('./'); 

// Associações de company
// Relações de 1:N 
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

// Export nothing or a function if you need to initialize associations explicitly
