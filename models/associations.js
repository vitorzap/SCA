module.exports = (db) => {
  const { Company, User, Client, Teacher, Specialty, TimeTable, City, State } = db;

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
  Client.belongsTo(User, { foreignKey: 'UserID', as: 'userInfo' });
  // Relação 1 x 1 User x Teacher
  console.log("ASSOCIANDO TEACHER - USER   ASSOCIANDO TEACHER - USER   ASSOCIANDO TEACHER - USER   ");
  User.hasOne(Teacher,{  foreignKey: 'UserID',  as: 'teacherInfo', onDelete: 'RESTRICT'});
  Teacher.belongsTo(User, { foreignKey: 'UserID', as: 'userInfo' });



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

}
