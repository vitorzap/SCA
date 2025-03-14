const { Client, User, City, ClientRegularSchedule, Appointment, sequelize } = require('../models');
const { UserRepository } = require('../repositories/');  
const { Op } = require('sequelize');
const { 
        generateUniqueUserName, 
        generateHashedPassword 
      } = require('../utils/user/userHelpers');


class ClientRepository {
  async create(clientData, transaction = null ) {
    userData = { 
      newName: clientData.Name,
      UserEmail: clientData.Email,
      newPassword: null,
      ID_UserType: clientData.ID_UserType,
      ID_Company: clientData.ID_Company
    }
    const allowedKeys = ["Name","Email","Phone","DateOfBirth",
      "Gender","CPF","Street","Complement","District","CEP",
      "RegistrationDate","ID_Company","ID_User","ID_City"];
    for (const key in clientData) { 
      if (!allowedKeys.includes(key)) { delete clientData[key]; }
    }

    const isLocalTransaction = !transaction;
    const currentTransaction = transaction || await sequelize.transaction();
    try {
      const { success, message, data: newUser } 
        = await UserRepository.create(reqData, currentTransaction);
      if (!success) {
        if (isLocalTransaction) { await currentTransaction.rollback();}
        return { success: false, message, data: {} }        
      }
      const newClient = Client.create(clientData, { transaction: transaction });
      if (isLocalTransaction) { await currentTransaction.commit() }
      return { 
        success: true, 
        message: 'Client successfully created',
        data: {
          user: newUser,
          client: newClient
        }
      }
    } catch (error) {
        if (currentTransaction) {
          if (isLocalTransaction) { await currentTransaction.rollback();}
        }
        return { 
          success: false, 
          message: error.message,
          data: {}
        }
    }
  }

  async findAll(filter = {}, onlyCount = false) {
    let count = 0
    try {
      if (onlyCount) {
        count = await Client.count({ where: filter });
        return {
          success: true,
          message: `${count} clients found`,
          data: { count }, 
        } 
      }   
    
      const clients = await Client.findAll({ where: filter });
      count = clients.length;
      return {
        success: true,
        message: `${count} clients found`,
        data: clients,
      };
    } catch (error) {
      return {
        success: false,
        message: 'An error occurred while fetching clients',
        data: [],
      };
    }
  }

  async findAllByCompany(ID_Company) {
    const clients = await Client.findAll({ where: { ID_Company } });
    const quantidade = clients.length;
    return { 
      success: true, 
      message: `${quantidade} clients found`,
      data: clients
    }
  }

  async findById(ID_Client, ID_Company) {
    const client =  await Client.findOne({
      where: { ID_Client, ID_Company },
      include: [{ model: User }]
    });
    return { 
      success: client ? true : false, 
      message: client ? "Client found" : "Client not found",
      data: client
    }
  }

  async findByName(name, ID_Company) {
    let whereCondition = { ID_Company };

    if (name.startsWith('*') && name.endsWith('*')) {
      name = name.slice(1, -1);
      whereCondition.Name = { [Op.like]: `%${name}%` }; 
    } else if (name.startsWith('*')) {
      name = name.slice(1);
      whereCondition.Name = { [Op.like]: `%${name}` }; 
    } else if (name.endsWith('*')) {
      name = name.slice(0, -1);
      whereCondition.Name = { [Op.like]: `${name}%` };
    } else {
      whereCondition.Name = name; // Exact match
    }

    const clients = await Client.findAll({ where: whereCondition });
    const quantidade = clients.length;
    return { 
      success: true, 
      message: `${quantidade} clients found`,
      data: clients
    }
  }

  async findByCPF(CPF, ID_Company) {
    const client =  await Client.findOne({where: {
        ID_Company,
        CPF
      },
        include: [{ model: User }]
    });
    return { 
      success: client ? true : false, 
      message: `Client with this CPF ${client ? "found" : "not found"}`,
      data: client
    }
  }  

  async update(clientData, transaction = null) {
    const idClient = clientData.ID_Client
    const idCompany = clientData.ID_Company;
    const idUser = clientData.ID_User;
    let userData
    if (clientData.Name !== clientData.oldName) {
      userData.ID_User = clientData.ID_User
      userData.ID_Company = clientData.ID_Company
      userData.newName = clientData.Name;
    }
    delete clientData.ID_Client;
    delete clientData.ID_Company;
    delete clientData.ID_User; 

    const isLocalTransaction = !transaction;
    const currentTransaction = transaction || await sequelize.transaction();
    try {
      if (userData.Id_User) {
        const { success,  message, dados } = 
          await UserRepository.update(userData,currentTransaction) 
        if (!success) {
          if (isLocalTransaction) { await currentTransaction.rollback();}
          return { success: false, message, dados }        
        }
      }

      await Client.update(clientData, {
        where: { ID_Client: idClient },
        transaction: currentTransaction,
      });
      if (isLocalTransaction) { await currentTransaction.commit() }
      return { 
        success: true, 
        message: 'Client successfully updated',
        data: {
          user: { UserName:  userData.newName },
          client: { ID_Client: idClient, 
                    ...clientData, 
                    ID_Company: idCompany, 
                    ID_User: idUser
                  }
        }
      }
    } catch (error) {
      if (currentTransaction) {
        if (isLocalTransaction) { await currentTransaction.rollback() }
      }
      return { 
        success: false, 
        message: error.message,
        data: {}
      }
    }
  }

  async delete(ID_Client, ID_Company, transaction = null) {
    const client =  await Client.findOne({
       where: { ID_Client, ID_Company } 
    });
    if (!client) {
      return { 
        success: false, 
        message: 'Client not found',
        data: {}
      }
    }

    const isLocalTransaction = !transaction;
    const currentTransaction = transaction || await sequelize.transaction();
    try {
      await Client.destroy({ 
        where: { ID_Client, ID_Company }, 
        currentTransaction 
      });
      await User.destroy({ 
        where: { ID_User: client.ID_User, ID_Company }, 
        currentTransaction 
      });
      if (isLocalTransaction) { await currentTransaction.commit() }
      return { 
        success: true, 
        message: 'Client deleted successfully',
        data: {}
      }         
    } catch (error) {
      if (currentTransaction) {
        if (isLocalTransaction) { await currentTransaction.rollback() }
      }
      return { 
        success: false, 
        message: error.message,
        data: {}
      }
    }
  }

  async findClientWithAssociationsOLD(ID_Client, ID_Company, transaction) {
    return Client.findOne({
      where: { ID_Client, ID_Company },
      include: [
        { model: User, required: false },
        { model: ClientRegularSchedule },
        { model: Appointment }
      ],
      transaction
    });
  }
}

module.exports = ClientRepository;