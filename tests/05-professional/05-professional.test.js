console.log(`PROFESSIONAL TEST - BEGIN`)
const dotenv = require('dotenv');
const { Sequelize, DataTypes } = require('sequelize');
const { customLogger } = require('../../utils/logHelpers.js');
const selectRandomElements = require('../../utils/arrayHelpers.js');
const bcrypt = require('bcrypt');
dotenv.config();
const env = process.env.NODE_ENV || 'test';
const config = require('../../config/config.json')[env];
console.log(`Database=${config.database}`)
const sequelize = new Sequelize(config.database, config.username, config.password, {
  ...config,
  logging: customLogger
});
const { Company, User, Professional, Specialty} = require('../../models/');

let app
const chai = require('chai');
const chaiHttp = require('chai-http');
const { expect } = chai;
chai.use(chaiHttp);
let testCompany, testUser, testProfessional;
let token;
let password;
let createdSpecialtiesIDs=[];
let initialSpecialtiesIDs; 
let newSpecialtiesIDs;

describe(' TESTE -Professional Controller', () => {
    before(async () => {
        try {
            const createApp = require('../../app.js');
            app = await createApp();
    
            // Criar a empresa de teste
            testCompany = await Company.create({ Name: 'Test Company' });
            console.log(`****** Company created ID=${testCompany.ID_Company}`);
    
            // Criar usuário de teste
            password = await bcrypt.hash('12345678', 10);
            testUser = await User.create({
                UserName: 'testAdmin',
                UserEmail: 'testadmin@test.com',
                UserPassword: password,
                ID_UserType: 1,
                ID_Company: testCompany.ID_Company
            });
            console.log(`User created ID=${testUser.ID_User}`);
    
            // Criar especialidades
            const specialties = ['Yoga', 'Pilates', 'Calisthenics', 'Funcional', 'Powerlifting'];
            const createdSpecialties = await Promise.all(
                specialties.map(description =>
                    Specialty.create({
                        Description: description,
                        ID_Company: testCompany.ID_Company
                    })
                )
            );
            createdSpecialtiesIDs = createdSpecialties
                .filter(specialty => specialty) // Filtra para garantir que as especialidades foram criadas
                .map(specialty => specialty.ID_Specialties);
            initialSpecialtiesIDs = 
                selectRandomElements(createdSpecialtiesIDs, 3);
            newSpecialtiesIDs = createdSpecialtiesIDs
                .filter(specialty => !initialSpecialtiesIDs.includes(specialty));                  
    
            console.log(`Ids de todas especialidades geradas =${createdSpecialtiesIDs}`)
            console.log(`Ids de especialidades para Inclusão =${initialSpecialtiesIDs}`)
            console.log(`Ids de especialidades para Alteração=$${newSpecialtiesIDs} `)   

            // Fazer login e obter o token
            const loginResponse = await chai.request(app)
                .post('/api/login')
                .send({
                    login: 'testadmin@test.com',
                    UserPassword: '12345678',
                    ID_Company: testCompany.ID_Company
                });
            token = loginResponse.body.token;
            console.log('Login successful, token obtained');
    
            if (!token) {
                throw new Error('Failed to obtain login token');
            }
        } catch (error) {
            console.error(`ABORTED: ${error.message}`);
            throw error; // Lança o erro para interromper os testes, já que a inicialização falhou
        }
    });

    after(async () => {
        // Remover os dados criados em ordem reversa de dependência
        await Professional.destroy({ where: { ID_Company: testCompany.ID_Company } });
        await User.destroy({ where: { ID_Company: testCompany.ID_Company } });
        await Specialty.destroy({ where: { ID_Company: testCompany.ID_Company } });
        await Company.destroy({ where: { ID_Company: testCompany.ID_Company } });   
    });


    describe(' TESTE -POST /api/professionals', () => {
        it('should create a professional', (done) => {
            const res = chai.request(app)
                .post('/api/professionals')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    Name: 'Test Professional',
                    Email: 'tprofessional@test.com',
                    specialtyIds: initialSpecialtiesIDs 
                })
                .end((err, res) => {    
                    testProfessional=res.body; 
                    expect(res).to.have.status(201);
                    expect(res.body).to.have.property('Name', 'Test Professional');
                    done();
                });
        });
    });

    describe(' TESTE -GET /api/professionals', () => {
        it('should retrieve all professionals for a company', done => {
            chai.request(app)
                .get('/api/professionals')
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('array');
                    done();
                });
        });
    });

    describe(' TESTE -GET /api/professionals/:id', () => {
        it('should retrieve a specific professional by ID', done => {
            chai.request(app)
                .get(`/api/professionals/${testProfessional.ID_Professional}`)
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.property('ID_Professional', testProfessional.ID_Professional);
                    done();
                });
        });
    });

    describe(' TESTE -PUT /api/professionals/:id', () => {
        it('should update a professional', done => {
            chai.request(app)
                .put(`/api/professionals/${testProfessional.ID_Professional}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ Name: 'Updated Name' })
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    // expect(res.body).to.have.property('Name', 'Updated Name');
                    done();
                });
        });
    });

    describe(' TESTE -GET /api/professionals/name', () => {
        it('should retrieve professionals by name pattern', done => {
            chai.request(app)
                .get(`/api/professionals/getbyname/Upda*`)
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('array').that.is.not.empty;
                    res.body.forEach(professional => {
                        expect(professional.Name).to.include('Updated');
                    });
                    done();
                });
        });
    });

    describe(' TESTE -GET /api/professionals/specialty/:specialtyId', () => {
        it('should retrieve professionals by specialty ID', done => {
            chai.request(app)
                .get(`/api/professionals/getbyspecialty/${initialSpecialtiesIDs[0]}`)
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('array');
                    done();
                });
        });
    });

    describe(' TESTE -PUT /api//professionals/:id/specialties', () => {
        it('should update the specialties of a professional', done => {
            chai.request(app)
                .put(`/api/professionals/${testProfessional.ID_Professional}/specialties`)
                .set('Authorization', `Bearer ${token}`)
                .send({ specialtyIds: newSpecialtiesIDs })
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.property('message', 'Professional specialties updated successfully.');
                    done();
                });
        });
    });

    describe(' TESTE -DELETE /api/professionals/:id', () => {
        it('should delete a professional', done => {
            chai.request(app)
                .delete(`/api/professionals/${testProfessional.ID_Professional}`)
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.property('message', 'Professional and corresponding user deleted successfully.');
                    done();
                });
        });
    });

});
