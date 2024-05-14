console.log(`CLIENT TEST - BEGIN`)
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
const Client = require('../../models/client')(sequelize, DataTypes);
const City = require('../../models/city')(sequelize, DataTypes);
const State = require('../../models/state')(sequelize, DataTypes);

const app = require('../../app');
const chai = require('chai');
const chaiHttp = require('chai-http');
const { expect } = chai;
chai.use(chaiHttp);

describe('Client Controller', () => {
    let token = '';
    let password;
    let testCompany, testUser, testClient, testState, testCity;

    before(async () => {
        console.log("BEFORE TESTE");
        testState = await State.create({
            Name: 'Test State',
            Acronym: 'TS',
            Cod_State: '00'
        });
        console.log(`State created ID=${testState.ID_State}`)

        testCity = await City.create({
            Name: 'Test City',
            ID_State: testState.ID_State,
            Cod_State: 'TS',
            Cod_City: '001'
        });
        console.log(`City created ID=${testCity.ID_City}`)

        testCompany = await Company.create({ Name: 'Test Company' });
        console.log(`Company created ID=${testCompany.ID_Company}`)

        password = await bcrypt.hash('12345678', 10);
        testUser = await User.create({
            UserName: 'testAdmin',
            UserEmail: 'testadmin@test.com',
            UserPassword: password,
            UserType: 'Admin',
            ID_Company: testCompany.ID_Company
        });
        console.log(`User created ID=${testUser.UserID}`)

        const clientData = {
            Name: 'Test Client',
            Email: 'testclient@test.com',
            CPF: '88334188129',
            Phone: '47967852134',
            ID_City: testCity.ID_City,
            ID_Company: testCompany.ID_Company,
            UserID: testUser.UserID
        };

        testClient = await Client.create(clientData);
        console.log(`Client created ID=${testClient.ClientID}`)

        const loginResponse = await chai.request(app)
        .post('/api/login')
        .send({
            login: 'testadmin@test.com',
            UserPassword: '12345678',
            ID_Company: testCompany.ID_Company
        });
        token = loginResponse.body.token;  
        if (!token) {
            throw new Error('ABORTED: Failed to login user');
        }
    });

    describe('POST /api/clients', () => {
        it('should create a client', async () => {
            const res = await chai.request(app)
                .post('/api/clients')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    Name: 'New Client',
                    Email: 'newclient@test.com',
                    CPF: '98765432100',
                    ID_City: testCity.ID_City
                });
            expect(res).to.have.status(201);
            expect(res.body.client).to.include({ Name: 'New Client' });
        });
    });

    describe('GET /api/clients', () => {
        it('should retrieve all clients for a company', async () => {
            const res = await chai.request(app)
                .get('/api/clients')
                .set('Authorization', `Bearer ${token}`);
            expect(res).to.have.status(200);
            expect(res.body).to.be.an('array').that.is.not.empty;
        });
    });

    describe('GET /api/clients/:id', () => {
        it('should retrieve a specific client by ID', async () => {
            console.log(`2Client created ID=${testClient.ClientID}`)
            const res = await chai.request(app)
                .get(`/api/clients/${testClient.ClientID}`)
                .set('Authorization', `Bearer ${token}`);
            expect(res).to.have.status(200);
            expect(res.body).to.have.property('Name', testClient.Name);
        });
    });

    describe('GET /api/clients/by-name', () => {
      it('should retrieve clients by name pattern "Test*"', done => {
          chai.request(app)
              .get('/api/clients/name/Test*')
              .set('Authorization', `Bearer ${token}`)
              .end((err, res) => {
                  expect(res).to.have.status(200);
                  expect(res.body).to.be.an('array').that.is.not.empty;
                  let found = res.body.some(client => client.Name.includes('Test Client'));
                  expect(found).to.be.true;
                  done();
              });
      });
    });
    
    describe('PUT /api/clients/:id', () => {
        it('should update a client', async () => {
            const res = await chai.request(app)
                .put(`/api/clients/${testClient.ClientID}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ Name: 'Updated Client Name' });
            expect(res).to.have.status(200);
            expect(res.body).to.have.property('message', 'Client and corresponding user updated successfully.');
        });
    });

    describe('DELETE /api/clients/:id', () => {
        it('should delete a client', async () => {
            const res = await chai.request(app)
                .delete(`/api/clients/${testClient.ClientID}`)
                .set('Authorization', `Bearer ${token}`);
            expect(res).to.have.status(200);
            expect(res.body).to.have.property('message', 'Client and corresponding user deleted successfully.');
        });
    });

    after(async () => {
        // Clean up created data in reverse order of dependency
        // await Client.destroy({ where: { ID_Company: testCompany.ID_Company } });
        // await User.destroy({ where: { ID_Company: testCompany.ID_Company } });
        // await City.destroy({ where: { ID_State: testState.ID_State } });
        // await State.destroy({ where: { ID_State: testState.ID_State } });
        // await Company.destroy({ where: { ID_Company: testCompany.ID_Company } });
    });
});
