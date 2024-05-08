console.log(`COMPANY TEST - BEGIN`)
const dotenv = require('dotenv');
const { Sequelize, DataTypes } = require('sequelize');
const customLogger = require('../../utils/logHelpers.js');
const bcrypt = require('bcrypt');
dotenv.config();
const env = process.env.NODE_ENV || 'test';
const config = require('../../config/config.json')[env];
console.log(`Database=${config.database}`)
const sequelize = new Sequelize(config.database, config.username, config.password, {
  ...config,
  logging: customLogger
});
const Company = require('../../models/company')(sequelize, DataTypes);
const User = require('../../models/user')(sequelize, DataTypes);

const app = require('../../app');
const chai = require('chai');
const chaiHttp = require('chai-http');
const { expect } = chai;
chai.use(chaiHttp);
var newCompany, testCompany, newUser;
var token;
var password;



describe('Company Controller', () => {

  // Simulando login e criação de token
  before(async () => {
    newCompany = await Company.create({
      Name: 'testCompany',
    })
    if (! newCompany) {
      throw new Error('ABORTED: Failed to create test Company');
    }
    console.log(`Company created ID=${newCompany.ID_Company}`)

    password = await bcrypt.hash('12345678', 10);
    newUser = await User.create({
        UserName: 'testuser',
        UserEmail: 'test@example.com',
        UserPassword: password,
        UserType: 'Root',
        ID_Company: newCompany.ID_Company
    });
    if (!newUser) {
      throw new Error('ABORTED: Failed to create test user');
    }
    console.log(`User created ID=${newUser.UserID}`)

    const loginResponse = await chai.request(app)
      .post('/api/login')
      .send({
          login: 'test@example.com',
          UserPassword: '12345678',
          ID_Company: newCompany.ID_Company
      });
      token = loginResponse.body.token;  // Save the token for future requests
      if (!token) {
        throw new Error('ABORTED: Failed to login user');
      }
  });

  describe('POST /api/companies', () => {
    it('should create a company and return the company object', async () => {
      const res = await chai.request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${token}`)
        .send({ Name: 'New Test Company', AdminEmail: 'zurtigao@mail.com'});
        testCompany=res.body;
      expect(res).to.have.status(201);
      expect(res.body).to.have.property('Name', 'New Test Company');
    });
  });

  describe('GET /api/companies', () => {
    it('should retrieve all companies', async () => {
      const res = await chai.request(app)
        .get('/api/companies')
        .set('Authorization', `Bearer ${token}`);

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('array').that.is.not.empty;
    });
  });

  describe('GET /api/companies/:id', () => {
    it('should retrieve a company by id', async () => {
      const res = await chai.request(app)
        .get(`/api/companies/${testCompany.ID_Company}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('Name', 'New Test Company');
    });
  });

  describe('GET /api/companies/name/:name', () => {
    it('should find companies by name pattern', async () => {
      const res = await chai.request(app)
        .get('/api/companies/name/Test*')
        .set('Authorization', `Bearer ${token}`);

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('array').that.is.not.empty;
    });
  });

  describe('PUT /api/companies/:id', () => {
    it('should update a company', async () => {
      const res = await chai.request(app)
        .put(`/api/companies/${testCompany.ID_Company}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ Name: 'Updated Test Company' });

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('Name', 'Updated Test Company');
    });
  });

  describe('DELETE /api/companies/:id', () => {
    beforeEach(async function() {
      await User.destroy({ where: { UserName: 'admin', ID_Company: testCompany.ID_Company } });
    });
    it('should delete a company', async () => {
      const res = await chai.request(app)
        .delete(`/api/companies/${testCompany.ID_Company}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('message', 'Company deleted successfully.');
    });
  });

  after(async () => {
    try {
      await User.destroy({ where: { ID_Company: { [Sequelize.Op.gt]: 0 }}});
      await Company.destroy({ where: { ID_Company: { [Sequelize.Op.gt]: 0 }}});
    } catch (error) {
      console.error('Failed to clear test data:', error);
    }
  });
});
