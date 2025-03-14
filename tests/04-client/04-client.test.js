console.log(`CLIENT TEST - BEGIN`)
const dotenv = require('dotenv');
const chai = require('chai');
const chaiHttp = require('chai-http');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize'); 
const { Company, User, Client, State, City, sequelize } = require('../../models');

const { expect } = chai;

dotenv.config();
chai.use(chaiHttp);

let app;
let newCompany;
let newUser, adminUser;
let token;
let password;
let newClient; 
let newState;
let newCity;

const clientData = {
    Name: 'Test Client',
    Email: 'testclient@test.com',
    CPF: '88334188129',
    Phone: '47967852134',
    ID_City: 0,
    ID_Company: 0,
    ID_User: 0,
    RegistrationDate: new Date() 
};

describe(' TESTE -Client Controller', () => {
    before(async () => {
        console.log('BEFORE BEFORE BEDORE') 
        try {
            // Clean up created data in reverse order of dependency
            for (let i = 1; i <= 3; i++) {
                // Clean up created data in reverse order of dependency
                await User.destroy({ where: { ID_User: { [Op.gt]: 0 }}});
                await Client.destroy({ where: { ID_Client: { [Op.gt]: 0 }}});
                await User.destroy({ where: { ID_User: { [Op.gt]: 0 }}});
                await City.destroy({ where: { ID_City: { [Op.gt]: 0 }}});
                await State.destroy({ where: { ID_State:  { [Op.gt]: 0 }}});
                await Company.destroy({ where: { ID_Company:  { [Op.gt]: 0 }}});
                
                // Print "LIMPO" followed by the iteration number
                console.log(`LIMPO ${i}`);
              }
            //
            const createApp = require('../../app.js');
            app = await createApp();

            newState = await State.create({
                Name: 'Test State',
                Acronym: 'TS',
                Cod_State: '00'
            });
            console.log(`State created ID=${newState.ID_State}`)

            newCity = await City.create({
                Name: 'Test State',
                ID_State: newState.ID_State,
                Cod_State: 'TS',
                Cod_City: '001'
            });
            console.log(`City created ID=${newCity.ID_City}`)
            clientData.ID_City=newCity.ID_City

            newCompany = await Company.create({ Name: 'Test Company' });
            console.log(`Company created ID=${newCompany.ID_Company}`)
            clientData.ID_Company=newCompany.ID_Company

            password = await bcrypt.hash('12345678', 10);
            newUser = await User.create({
                UserName: 'test Client',
                UserEmail: 'testclient@test.com',
                UserPassword: password,
                ID_UserType: 4,
                ID_Company: newCompany.ID_Company
            });
            console.log(`User created ID=${newUser.ID_User}`)
            clientData.ID_User=newUser.ID_User

            newClient = await Client.create(clientData);
            console.log(`Client created ID=${newClient.ID_Client} \n`+
                        `Client Company ID=${newClient.ID_Company}`)

            adminUser = await User.create({
                UserName: 'testAdmin',
                UserEmail: 'testadmin@test.com',
                UserPassword: password,
                ID_UserType: 4,
                ID_Company: newCompany.ID_Company
            });
            console.log(`Admin User created ID=${newUser.ID_User}`)
            clientData.ID_User=newUser.ID_User

            // Simulando login e salvando token
            const loginResponse = await chai.request(app)
            .post('/api/login')
            .send({
            login: 'testadmin@test.com',
            UserPassword: '12345678',
            ID_Company: newCompany.ID_Company,
            });
            token = loginResponse.body.token;
            if (!token) {
                throw new Error('ABORTED: Failed to login user');
            }
            console.log(`Admin logged \n token=${token}`)

        } catch(error) {
            console.log(`****ERRO: ${error.message}`)
            console.log(error.name); // e.g., "TypeError"
            console.log(error.cause); // Mostra o erro inicial que causou o erro atual
            console.log(error.code);
            console.log(error.errors); 
            console.log(error.stack);
        }
    });


    after(async () => {
        // Clean up created data in reverse order of dependency
        await Client.destroy({ where: { ID_Company: newCompany.ID_Company } });
        await User.destroy({ where: { ID_Company: newCompany.ID_Company } });
        await City.destroy({ where: { ID_State: newState.ID_State } });
        await State.destroy({ where: { ID_State: newState.ID_State } });
        await Company.destroy({ where: { ID_Company: newCompany.ID_Company } });
    });

    describe(' TESTE -POST /api/clients', () => {
        it('should create a client', async () => {
            const res = await chai.request(app)
                .post('/api/clients')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    Name: 'New Client',
                    Email: 'newclient@test.com',
                    CPF: '98765432100',
                    ID_City: newCity.ID_City
                });

// Log the main components of the response
console.log('Status:', res.status);
console.log('Body:', JSON.stringify(res.body, null, 2));
console.log('Message:', res.body.message || 'No message found in response body');




            expect(res).to.have.status(201);
            expect(res.body.client).to.include({ Name: 'New Client' });
        });
    });

    describe(' TESTE -GET /api/clients', () => {
        console.log('GETALL')
        it('should retrieve all clients for a company', async () => {
            const res = await chai.request(app)
                .get('/api/clients')
                .set('Authorization', `Bearer ${token}`);
            expect(res).to.have.status(200);
            expect(res.body).to.be.an('array').that.is.not.empty;
        });
    });

    describe(' TESTE -GET /api/clients/:id', () => {
        it('should retrieve a specific client by ID', async () => {
            console.log(`2Client created ID=${newClient.ID_Client}`)
            const res = await chai.request(app)
                .get(`/api/clients/${newClient.ID_Client}`)
                .set('Authorization', `Bearer ${token}`);
            expect(res).to.have.status(200);
            expect(res.body).to.have.property('Name', newClient.Name);
        });
    });

    describe(' TESTE -GET /api/clients/getbyname/:name', () => {
      it('should retrieve clients by name pattern "Test*"', done => {
          const argPesq = clientData.Name.substring(0, 4) + '*'
          chai.request(app)
              .get('/api/clients/getbyname/Test*')
              .set('Authorization', `Bearer ${token}`)
              .end((err, res) => {
                  expect(res).to.have.status(200);
                  expect(res.body).to.be.an('array').that.is.not.empty;
                  let found = res.body.some(client => client.Name.includes(clientData.Name));
                  expect(found).to.be.true;
                  done();
              });
      });
    });
    
    describe(' newE -PUT /api/clients/:id', () => {
        it('should update a client', async () => {
            const res = await chai.request(app)
                .put(`/api/clients/${newClient.ID_Client}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ Name: 'Updated Client Name' });


                console.log('Status:', res.status);
                console.log('Body:', JSON.stringify(res.body, null, 2));
                console.log('Message:', res.body.message || 'No message found in response body');



            expect(res).to.have.status(200);
            expect(res.body.client).to.have.property('Name', 'Updated Client Name');
        });
    });

    describe(' newE -DELETE /api/clients/:id', () => {
        it('should delete a client', async () => {
            const res = await chai.request(app)
                .delete(`/api/clients/${newClient.ID_Client}`)
                .set('Authorization', `Bearer ${token}`);
            expect(res).to.have.status(200);
            expect(res.body).to.have.property('message', 'Client and corresponding user deleted successfully.');
        });
    });

});
