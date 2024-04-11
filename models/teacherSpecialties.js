module.exports = (sequelize, DataTypes) => {
  const TeacherSpecialties = sequelize.define('TeacherSpecialties', {
    ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    ID_Teacher: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Teachers', // This should match the table name for Teacher
        key: 'ID_Teacher'
      }
    },
    ID_Specialties: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Specialties', // This should match the table name for Specialty
        key: 'ID_Specialties'
      }
    }
  }, {
    timestamps: false,
    tableName: 'TeacherSpecialties'
  });

  // Association setups (if not set elsewhere)
  TeacherSpecialties.associate = (models) => {
    models.Teacher.belongsToMany(models.Specialty, { through: TeacherSpecialties, foreignKey: 'ID_Teacher' });
    models.Specialty.belongsToMany(models.Teacher, { through: TeacherSpecialties, foreignKey: 'ID_Specialties' });
  };

  return TeacherSpecialties;
};
