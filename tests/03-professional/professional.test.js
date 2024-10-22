// professionalController.test.js
console.log(`TEACHER TEST - BEGIN`)
const dotenv = require('dotenv');
const { Sequelize, DataTypes } = require('sequelize');
const customLogger = require('../../utils/logHelpers.js');
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
const Company = require('../../models/company')(sequelize, DataTypes);
const User = require('../../models/user')(sequelize, DataTypes);
const Professional = require('../../models/professional.js')(sequelize, DataTypes);
const Specialty = require('../../models/specialty.js')(sequelize, DataTypes);

const app = require('../../app');
const chai = require('chai');
const chaiHttp = require('chai-http');
const specialty = require('../../models/specialty.js');
const { expect } = chai;
chai.use(chaiHttp);

describe('Professional Controller', () => {
    let token = '';
    let password;
    let testCompany, testUser, testProfessional; 
    let createdSpecialtiesIDs=[];
    let initialSpecialtiesIDs; 


    before(async () => {
        testCompany = await Company.create({ Name: 'Test Company' });
        if (!testCompany) {
            throw new Error('ABORTED: Failed to create test Company');
        }
        console.log(`Company created ID=${testCompany.ID_Company}`)

        password = await bcrypt.hash('12345678', 10);
        testUser = await User.create({
            UserName: 'testAdmin',
            UserEmail: 'testadmin@test.com',
            UserPassword: password, 
            UserType: 'Admin',
            ID_Company: testCompany.ID_Company
        });
        if (!testUser) {
            throw new Error('ABORTED: Failed to create test user');
        }
        console.log(`User created ID=${testUser.ID_User}`)

        const specialties = ['Yoga', 'Pilates', 'Calisthenics', 'Funcional', 'Powerlifting'];
        try {
            const specialtyPromises = specialties.map(description => 
                Specialty.create({
                    Description: description,
                    ID_Company: testCompany.ID_Company
                })
            );
            const createdSpecialties = await Promise.all(specialtyPromises);
            createdSpecialties.forEach(specialty => {
                if (!specialty) {
                    throw new Error('ABORTED: Failed to create one or more specialties');
                }
                createdSpecialtiesIDs.push(specialty.ID_Specialties);
            });
        } catch (error) {
            console.error(`Error during specialty creation: ${error.message}`);
        }
        
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


    describe('POST /api/professionals', () => {
        it('should create a professional', (done) => {
            initialSpecialtiesIDs = selectRandomElements(createdSpecialtiesIDs, 3);
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

    describe('GET /api/professionals', () => {
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

    describe('GET /api/professionals/:id', () => {
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

    describe('PUT /api/professionals/:id', () => {
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

  describe('GET /api/professionals/name', () => {
      it('should retrieve professionals by name pattern', done => {
          chai.request(app)
              .get(`/api/professionals/name/Upda*`)
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

  describe('GET /api/professionals/specialty/:specialtyId', () => {
      it('should retrieve professionals by specialty ID', done => {
          chai.request(app)
              .get(`/api/professionals/specialty/${initialSpecialtiesIDs[0]}`)
              .set('Authorization', `Bearer ${token}`)
              .end((err, res) => {
                  expect(res).to.have.status(200);
                  expect(res.body).to.be.an('array');
                  done();
              });
      });
  });

  describe('PUT /api/professionals/update-specialty/:id', () => {
      const newSpecialtiesIDs = createdSpecialtiesIDs
                        .filter(specialty => !initialSpecialtiesIDs.includes(specialty));    
      it('should update the specialties of a professional', done => {
          chai.request(app)
              .put(`/api/professionals/update-specialty/${testProfessional.ID_Professional}`)
              .set('Authorization', `Bearer ${token}`)
              .send({ specialtyIds: newSpecialtiesIDs })
              .end((err, res) => {
                  expect(res).to.have.status(200);
                  expect(res.body).to.have.property('message', 'Professional specialties updated successfully.');
                  done();
              });
      });
  });

describe('DELETE /api/professionals/:id', () => {
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


  after(async () => {
    // Remover os dados criados em ordem reversa de dependência
    await Professional.destroy({ where: { ID_Company: testCompany.ID_Company } });
    await User.destroy({ where: { ID_Company: testCompany.ID_Company } });
    await Specialty.destroy({ where: { ID_Company: testCompany.ID_Company } });
    await Company.destroy({ where: { ID_Company: testCompany.ID_Company } });
  });



});
