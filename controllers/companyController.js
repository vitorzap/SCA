const BaseController = require('./baseController');
 
const { sendEmailbyTemplate } = require('../utils/helpers/emailHelpers');
const { generateFlatPassword } = require('../utils/helpers/passwordHelpers');
const { Op } = require('sequelize');

class CompanyController extends BaseController {
  constructor({ companyRepository, yup, userRepository, userTypeRepository}) {
    super(companyRepository, yup);
    this.userRepository = userRepository;
    this.userTypeRepository = userTypeRepository;

    this.getByName = this.getByName.bind(this);
    this.getFilter = this.getFilter.bind(this);
    this.getExtraFieldsNames = this.getExtraFieldsNames.bind(this);
    this.posCreate = this.posCreate.bind(this);
  }

  createsUniquenessConstraint(inData) {
    const constraints = [];
    if (inData.Name) {
      constraints.push({ Name: inData.Name });
    }
    return constraints;
  }

  getFilter(req, filterSelector = null) {
    try {
      if (filterSelector && filterSelector === 'byname') {
        const name = req.body['name'] || req.query.name;
        if (!name) {
          return {
            success: false,
            message: 'Company name is required',
            data: [],
            unexpected: false,
          };
        }
        return {
          success: true,
          message: '',
          data: this.formatFilter(name),
          unexpected: false,
        };
      } else {
        return super.getFilter(req, filterSelector);
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: [],
        unexpected: true,
      };
    }
  }

  async getByName(req, res) {
    return await this.getAll(req, res, 'byname');
  }

  getExtraFieldsNames(originAction) {
    const action = originAction.toUpperCase();
    if (action === 'CREATE') {
      return ['AdminEmail'];
    } else if (action === 'UPDATE') {
      return [];
    } else if (action === 'DELETE') {
      return ['confirmDeleteAdmin'];
    }
    return super.getExtraFieldsNames(originAction);
  }

  async posCreate(reqData, transaction = null) {
    const typeLevelFindResult =
      await this.userTypeRepository.findByTypeLevel(1);
    if (!typeLevelFindResult.success) {
      return typeLevelFindResult;
    }
    const userTypeIds =
      typeLevelFindResult.data.records.map((record) => record.ID_UserType);
    if (userTypeIds.length === 0) {
      return {
        success: false,
        message: 'There are no user levels for Admin',
        data: [],
        unexpected: false,
      };
    }
    const AdminUserTypeID = Math.min(...userTypeIds);

    const passwordLength =
      parseInt(process.env.AUTO_GENERATED_PASSWORD_LENGTH) || 10;
    const flatPassword = generateFlatPassword(passwordLength);
    const adminUser = {
      UserName: 'admin' + reqData[this.modelName].ID_Company,
      newPassword: flatPassword,
      UserEmail: reqData.AdminEmail,
      ID_UserType: AdminUserTypeID,
      ID_Company: reqData[this.modelName].ID_Company,
    };
    const userCreateResult = await this.userRepository.create(
      adminUser,
      transaction
    );
    if (!userCreateResult.success) {
      return userCreateResult;
    }

    const emailData = {
      subject: 'Your Admin Account Details',
      recipient: reqData.AdminEmail,
      companyName: reqData.Name,
      password: flatPassword,
    };

    const sendMailResult = await sendEmailbyTemplate(
      emailData,
      'newAdminAccountMail'
    );
    if (!sendMailResult.success) {
      return sendMailResult;
    }

    if (userCreateResult.data && userCreateResult.data.UserPassword) {
      delete userCreateResult.data.UserPassword;
      userCreateResult.data.UserPassword = '********';
    }
    return userCreateResult;
  }

  async preDelete(reqData, transaction = null) {
    try {
      const typeLevelFindResult =
        await this.userTypeRepository.findByTypeLevel(1);
      if (!typeLevelFindResult.success) {
        return typeLevelFindResult;
      }
      const userTypeIds =
        typeLevelFindResult.data.records.map((record) => record.ID_UserType);
      if (userTypeIds.length === 0) {
        return {
          success: true,
          message:
            'There are no such user levels so there should be no users of this level to be excluded',
          data: [],
          unexpected: false,
        };
      }
      const userFilter = {
        ID_Company: reqData.id,
        ID_UserType: { [Op.in]: userTypeIds },
      };
      const userDeleteResult = await this.userRepository.deleteByFilter(
        userFilter,
        transaction
      );
      if (!userDeleteResult.success) {
        return userDeleteResult;
      }
      return {
        success: true,
        message: `${userDeleteResult} users deleted successfully.`,
        data: { deletedCount: userDeleteResult },
        unexpected: false,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: [],
        unexpected: true,
      };
    }
  }
}

module.exports =  CompanyController;