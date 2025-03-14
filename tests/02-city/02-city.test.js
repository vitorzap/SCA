console.log(`CITY TEST - BEGIN`)
const dotenv = require('dotenv');
const chai = require('chai');
const chaiHttp = require('chai-http');
const bcrypt = require('bcrypt');
const { Company, User, State, City, sequelize } = require('../../models');

const { expect } = chai;

dotenv.config();
chai.use(chaiHttp);

let app;
let newCompany, newUser;
let token;
let password;
let newState;
let newCity;

describe(' TESTE -City Controller', () => {
  before(async () => {
    try {
      const createApp = require('../../app.js');
      app = await createApp();

      await City.destroy({ where: {}});
      await State.destroy({ where: {}});

      // Criando Company para o teste
      newCompany = await Company.create({
        Name: 'testCompany',
      });
      if (!newCompany) {
        throw new Error('ABORTED: Failed to create test Company');
      }
      console.log(`Company created ID=${newCompany.ID_Company}`);

      // Criando senha e usuário de teste
      password = await bcrypt.hash('12345678', 10);
      newUser = await User.create({
        UserName: 'testuser',
        UserEmail: 'test@example.com',
        UserPassword: password,
        ID_UserType: 1,
        ID_Company: newCompany.ID_Company,
      });
      if (!newUser) {
        throw new Error('ABORTED: Failed to create test user');
      }
      console.log(`User created ID=${newUser.ID_User}`);

      // Simulando login e salvando token
      const loginResponse = await chai.request(app)
        .post('/api/login')
        .send({
          login: 'test@example.com',
          UserPassword: '12345678',
          ID_Company: newCompany.ID_Company,
        });
      token = loginResponse.body.token;
      if (!token) {
        throw new Error('ABORTED: Failed to login user');
      }

      // Criando Estado de teste
      newState = await State.create({ Name: 'TestState', Acronym: 'TS', Cod_State: '99' });
      console.log(`State created ID=${newState.ID_State}`);

      // Criando Cidade de teste
      newCity = await City.create({ 
        Name: 'TestCity',
        ID_State: newState.ID_State,
        Cod_State:'TS',  
        Cod_City: '002' 
      });
      console.log(`City created ID=${newCity.ID_City}`);

    } catch(error) {
      console.log(`ERRO: ${error.message}`)
    }
  });

  after(async () => {
    // Limpeza de dados e encerramento da conexão
    await User.destroy({ where: { ID_User: newUser.ID_User } });
    await Company.destroy({ where: { ID_Company: newCompany.ID_Company } });
    await City.destroy({ where: { ID_State: newState.ID_State } });
    await State.destroy({ where: { ID_State: newState.ID_State } });
  });

  describe('POST /cities - Create City', () => {
    it('deve criar uma nova cidade', async () => {
      const res = await chai.request(app)
        .post('/api/cities')
        .set('Authorization', `Bearer ${token}`)
        .send({
          ID_State: newState.ID_State,
          Name: 'New City',
          Cod_State: 'NC',
          Cod_City: '00001',
        });

      expect(res).to.have.status(201);
      expect(res.body).to.have.property('ID_City');
      expect(res.body.Name).to.equal('New City');
    });

    it('deve retornar erro para entrada inválida', async () => {
      const res = await chai.request(app)
        .post('/api/cities')
        .set('Authorization', `Bearer ${token}`)
        .send({
          ID_State: newState.ID_State,
          Name: '', // Nome inválido
          Cod_State: 'N', // Cod_State inválido
          Cod_City: '', // Cod_City inválido
        });

      expect(res).to.have.status(400);
      expect(res.body).to.have.property('message');
    });

    it('deve retornar erro para estado inexistente', async () => {
      const res = await chai.request(app)
        .post('/api/cities')
        .set('Authorization', `Bearer ${token}`)
        .send({
          ID_State: 999999, // ID inexistente
          Name: 'Some City',
          Cod_State: 'SC',
          Cod_City: '00002',
        });

      expect(res).to.have.status(400);
      expect(res.body.error).to.equal('State not found.');
    });

    it('deve retornar erro para cidade duplicada no mesmo estado', async () => {
      await chai.request(app)
        .post('/api/cities')
        .set('Authorization', `Bearer ${token}`)
        .send({
          ID_State: newState.ID_State,
          Name: 'Duplicate City',
          Cod_State: 'DC',
          Cod_City: '00003',
        });

      const res = await chai.request(app)
        .post('/api/cities')
        .set('Authorization', `Bearer ${token}`)
        .send({
          ID_State: newState.ID_State,
          Name: 'Duplicate City', // Nome duplicado
          Cod_State: 'DC', // Cod_State duplicado
          Cod_City: '00003', // Cod_City duplicado
        });

      expect(res).to.have.status(400);
      expect(res.body.error).to.equal('A city with the same name or code already exists in the state.');
    });
  });

  describe('GET /api/cities/:id - Get City by ID', () => {
    it('deve retornar uma cidade pelo ID', async () => {
      const res = await chai.request(app)
        .get(`/api/cities/${newCity.ID_City}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(200);
      expect(res.body).to.have.property('ID_City');
    });
  });

  describe('GET /api/cities - List All Cities', () => {
    it('deve listar todas as cidades', async () => {
      const res = await chai.request(app).get('/api/cities').set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(200);
      expect(res.body).to.be.an('array');
    });
  });

  describe('PUT /api/cities/:id - Update City', () => {
    it('deve atualizar os detalhes da cidade', async () => {
      const res = await chai.request(app)
        .put(`/api/cities/${newCity.ID_City}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          Name: 'Updated City',
          Cod_State: 'UC',
          Cod_City: '67890',
        });

        
  // Log the main components of the response
  console.log('Status:', res.status);
  console.log('message:', res.body.message || 'No message found in response body');
      

      expect(res).to.have.status(200);
      expect(res.body.message).to.equal('City updated successfully.');
    });
  });

  describe('DELETE /api/cities/:id - Delete City', () => {
    it('deve deletar uma cidade', async () => {
      const res = await chai.request(app)
        .delete(`/api/cities/${newCity.ID_City}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(200);
      expect(res.body.message).to.equal('City deleted successfully.');
    });
  });
});