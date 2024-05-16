module.exports = (db) => {
  const { Company, User, Client, Teacher, Specialty, RegularSchedule, Appointment, TimeTable, City, State } = db;

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
  Company.hasMany(RegularSchedule, { foreignKey: 'ID_Company' });
  RegularSchedule.belongsTo(Company, { foreignKey: 'ID_Company' });
  //
  Company.hasMany(Appointment, { foreignKey: 'ID_Company' });
  Appointment.belongsTo(Company, {foreignKey: 'ID_Company' });
  //
  Company.hasMany(User, { foreignKey: 'ID_Company' });
  User.belongsTo(Company, { foreignKey: 'ID_Company' });
  //

  // Associações de user
  // Relação 1 x 1 User x Client
  User.hasOne(Client,{  foreignKey: 'UserID',  as: 'clientInfo', onDelete: 'RESTRICT'});
  Client.belongsTo(User, { foreignKey: 'UserID', as: 'userInfo' });
  // Relação 1 x 1 User x Teacher
  User.hasOne(Teacher,{  foreignKey: 'UserID',  as: 'teacherInfo', onDelete: 'RESTRICT'});
  Teacher.belongsTo(User, { foreignKey: 'UserID', as: 'userInfo' });



  // Associações de teachers
  // Define associations N x N => Teacher x Specialty
  Teacher.belongsToMany(Specialty, { through: 'TeacherSpecialties', foreignKey: 'ID_Teacher' });
  Specialty.belongsToMany(Teacher, { through: 'TeacherSpecialties', foreignKey: 'ID_Specialties' });

  // Relações de 1:N  teacher 1 x timeTable N
  Teacher.hasMany(TimeTable, { foreignKey: 'ID_Teacher' });
  TimeTable.belongsTo(Teacher, { foreignKey: 'ID_Teacher' });
  // Relações de 1:N  teacher 1 x RegularSchedule N
  Teacher.hasMany(RegularSchedule, { foreignKey: 'ID_Teacher' });
  RegularSchedule.belongsTo(Teacher, { foreignKey: 'ID_Teacher' });
  // Relações de 1:N  teacher 1 x Appointment N
  Teacher.hasMany(Appointment, { foreignKey: 'ID_Teacher' });
  Appointment.belongsTo(Teacher, { foreignKey: 'ID_Teacher' });


  // Relações de 1:N Specialty 1 x timeTable N
  Specialty.hasMany(TimeTable, { foreignKey: 'ID_Specialty' });
  TimeTable.belongsTo(Specialty, { foreignKey: 'ID_Specialty' });
  // Relações de 1:N Specialty 1 x timeTable N
  Specialty.hasMany(RegularSchedule, { foreignKey: 'ID_Specialty' });
  RegularSchedule.belongsTo(Specialty, { foreignKey: 'ID_Specialty' });
  // Relações de 1:N Specialty 1 x timeTable N
  Specialty.hasMany(Appointment, { foreignKey: 'ID_Specialty' });
  Appointment.belongsTo(Specialty, { foreignKey: 'ID_Specialty' });

  // Relações de N:N TimeTable x Client 
  TimeTable.belongsToMany(Client, { through: 'TimeTableClients', foreignKey: 'ID_TimeTable' });
  Client.belongsToMany(TimeTable, { through: 'TimeTableClients', foreignKey: 'ClientID' });
  // Relações de N:N TimeTable x Client 
  RegularSchedule.belongsToMany(Client, { through: 'RegularScheduleClients', foreignKey: 'ID_TimeTable' });
  Client.belongsToMany(RegularSchedule, { through: 'RegularScheduleClients', foreignKey: 'ClientID' });
  // Relação Client x Appointment 
  Client.hasMany(Appointment, { foreignKey: 'ClientID' });
  Appointment.belongsTo(Client, { foreignKey: 'ClientID' });
  // Relação  Cliente x RegularSchedulle
  Client.belongsToMany(models.RegularSchedule, {
      through: models.ClientRegularSchedules,
      foreignKey: 'ClientID',
      otherKey: 'ID_RegularSchedule',
      as: 'RegularSchedules'
    });
  };
  RegularSchedule.belongsToMany(models.Client, {
    through: models.ClientRegularSchedules,
    foreignKey: 'ID_RegularSchedule',
    otherKey: 'ClientID',
    as: 'Clients'
  });

  // RegularSchedule Associações
  Appointment.belongsTo(RegularSchedule, {foreignKey: 'ID_RegularSchedule', allowNull: true });
  RegularSchedule.hasMany(Appointment, { foreignKey: 'ID_RegularSchedule' });

  // Associações de City(Cidade)
  // Relações de 1:N  City 1 x  N  Cliente
  Client.belongsTo(City, {foreignKey: 'ID_City'});
  City.hasMany(Client, {foreignKey: 'ID_City'});

  // Associações de State(Estado)
  // Relações de 1:N  State 1 x  N City
  City.belongsTo(State, {foreignKey: 'ID_State'});
  State.hasMany(City, {foreignKey: 'ID_State'});

}
