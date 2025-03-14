'use strict';
module.exports = (sequelize, DataTypes) => {
  const Professional = sequelize.define('Professional', {
    ID_Professional: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    Name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    ID_Company: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Companies',
        key: 'ID_Company'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT'
    },
    ID_User: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'ID_User'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    }
  },  {
    timestamps: false,
  });

  Professional.associate = (db) => {
    Professional.belongsTo(db.Company, { foreignKey: 'ID_Company' });
    Professional.belongsTo(db.User, { foreignKey: 'ID_User' });
    Professional.hasMany(db.ProfessionalSpecialty, { foreignKey: 'ID_Professional' });
    Professional.hasMany(db.RegularSchedule, { foreignKey: 'ID_Professional' });
    Professional.hasMany(db.Appointment, { foreignKey: 'ID_Professional' });
  };

    // Método para adicionar especialidades
  Professional.prototype.addSpecialties = async function(specialtyIds, transaction = null) {
    try {
      const records = specialtyIds.map((id) => ({
        ID_Professional: this.ID_Professional, // Usa o ID da instância atual
        ID_Specialties: id,
      }));
  
      const createdRecords = await sequelize.models.ProfessionalSpecialty.bulkCreate(records, { transaction });
      
      return createdRecords;
    } catch (error) {
      throw error;
    }
  };


  // Método para excluir especialidades
  Professional.prototype.deleteSpecialties = async function(transaction = null) {
    try {
      if (!this.ID_Professional) {
        throw new Error('ID_Professional is not defined.');
      }
      const ProfessionalSpecialty = sequelize.models.ProfessionalSpecialty;
      if (!ProfessionalSpecialty) {
        throw new Error('ProfessionalSpecialty model is not loaded.');
      }  
  
      const deletedCount = await sequelize.models.ProfessionalSpecialty.destroy({
        where: {
          ID_Professional: this.ID_Professional
        },
        transaction, // Passa a transação, se fornecida
      });

      return deletedCount; // Retorna o número de registros excluídos.
    } catch (error) {
      throw error;
    }
  };

// Método para atualizar especialidades
Professional.prototype.updateSpecialties = async function(newSpecialtyIds, transaction = null) {
  const internalTransaction = transaction || await sequelize.transaction();
  
  try {
    // Passo 1: Excluir todas as especialidades existentes do Professional usando o método deleteSpecialties
    await this.deleteSpecialties(internalTransaction);

    // Passo 2: Adicionar as novas especialidades usando o método addSpecialties
    const createdRecords = await this.addSpecialties(newSpecialtyIds, internalTransaction);

    // Commit da transação se foi criada internamente
    if (!transaction) {
      await internalTransaction.commit();
    }

    return createdRecords;
  } catch (error) {
    // Rollback da transação em caso de erro, se a transação foi criada internamente
    if (!transaction) {
      await internalTransaction.rollback();
    }
    throw error;
  }
};



  return Professional;
};