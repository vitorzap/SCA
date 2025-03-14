console.log(`COMPANY TEST - BEGIN`)
const dotenv = require('dotenv');
const chai = require('chai');
const chaiHttp = require('chai-http');
const bcrypt = require('bcrypt');
const { Company, User } = require('../../models');

const { expect } = chai;

chai.use(chaiHttp);
dotenv.config();

let app
let newCompany, newUser;
let token;
let password;

describe(' TESTE -Company Controller', () => {

  // Simulando login e criação de token
  before(async () => {      
    const createApp = require('../../app.js'); 
    app = await createApp()

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
        ID_UserType: 1,
        ID_Company: newCompany.ID_Company
    });
    if (!newUser) {
      throw new Error('ABORTED: Failed to create test user');
    }
    console.log(`User created ID=${newUser.ID_User}`)

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

  describe(' TESTE -POST /api/companies', () => {
    it('should create a company and return the company object', async () => {
      const res = await chai.request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${token}`)
        .send({ Name: 'New Test Company', AdminEmail: 'zurtigao@mail.com'});
      expect(res).to.have.status(201);
      expect(res.body).to.have.property('Name', 'New Test Company');
    });
  });

  describe(' TESTE -GET /api/companies', () => {
    it('should retrieve all companies', async () => {
      const res = await chai.request(app)
        .get('/api/companies')
        .set('Authorization', `Bearer ${token}`);

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('array').that.is.not.empty;
    });
  });

  describe(' TESTE -GET /api/companies/:id', () => {
    it('should retrieve a company by id', async () => {
      const res = await chai.request(app)
        .get(`/api/companies/${newCompany.ID_Company}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('ID_Company', newCompany.ID_Company);
      expect(res.body).to.have.property('Name', newCompany.Name);
    });
  });

  describe(' TESTE -GET /api/companies/getbyname/:name', () => {
    it('should find companies by name pattern', async () => {
      const res = await chai.request(app)
        .get('/api/companies/getbyname/Test*')
        .set('Authorization', `Bearer ${token}`);

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('array').that.is.not.empty;
    });
  });

  describe(' TESTE -PUT /api/companies/:id', () => {
    it('should update a company', async () => {
      const res = await chai.request(app)
        .put(`/api/companies/${newCompany.ID_Company}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ Name: 'Updated Test Company' });

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('Name', 'Updated Test Company');
    });
  });

  describe(' TESTE -DELETE /api/companies/:id', () => {
    it('should not delete a company - need confirmation', async () => {
      const res = await chai.request(app)
        .delete(`/api/companies/${newCompany.ID_Company}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(403);
      expect(res.body).to.have.property('message', 'Confirmation required to delete the admin user along with the company.');
    });
  });

  describe(' TESTE -DELETE /api/companies/:id', () => {

    before(async () => {
      // Perform login to obtain a new token
      const loginResponse = await chai.request(app)
      .post('/api/login')
      .send({
        login: 'test@example.com',
        UserPassword: '12345678',
        ID_Company: newCompany.ID_Company
      });
      
      // Extract the token from the login response
      token = loginResponse.body.token;
    });
    
    after(async () => {
      try {
        await User.destroy({ where: { ID_Company: { [Sequelize.Op.gt]: 0 }}});
        await Company.destroy({ where: { ID_Company: { [Sequelize.Op.gt]: 0 }}});
      } catch (error) {
        console.error('Failed to clear test data:', error);
      }
    });
    
    it('should delete a company', async () => {
      const res = await chai.request(app)
      .delete(`/api/companies/${newCompany.ID_Company}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ confirmDeleteAdmin: true });
      expect(res).to.have.status(200);
      expect(res.body).to.have.property('message', `Company (${newCompany.ID_Company}) deleted successfully.`);
    });
  });
});
