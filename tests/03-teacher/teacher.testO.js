// teacherController.test.js
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
const Teacher = require('../../models/teacher.js')(sequelize, DataTypes);
const Specialty = require('../../models/specialty.js')(sequelize, DataTypes);

const app = require('../../app');
const chai = require('chai');
const chaiHttp = require('chai-http');
const specialty = require('../../models/specialty.js');
const { expect } = chai;
chai.use(chaiHttp);

describe('Teacher Controller', () => {
    let token = '';
    let password;
    let testCompany, testUser, testTeacher; 
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
        console.log(`User created ID=${testUser.UserID}`)

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


    describe('POST /api/teachers', () => {
        it('should create a teacher', (done) => {
            initialSpecialtiesIDs = selectRandomElements(createdSpecialtiesIDs, 3);
            const res = chai.request(app)
                .post('/api/teachers')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    Name: 'Test Teacher',
                    Email: 'tteacher@test.com',
                    specialtyIds: initialSpecialtiesIDs 
                })
                .end((err, res) => {    
                    testTeacher=res.body;  
                    expect(res).to.have.status(201);
                    expect(res.body).to.have.property('Name', 'Test Teacher');
                    done();
                });
        });
    });

    describe('GET /api/teachers', () => {
        it('should retrieve all teachers for a company', done => {
            chai.request(app)
                .get('/api/teachers')
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('array');
                    done();
                });
        });
    });

    describe('GET /api/teachers/:id', () => {
        it('should retrieve a specific teacher by ID', done => {
            chai.request(app)
                .get(`/api/teachers/${testTeacher.ID_Teacher}`)
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.property('ID_Teacher', testTeacher.ID_Teacher);
                    done();
                });
        });
    });

    describe('PUT /api/teachers/:id', () => {
        it('should update a teacher', done => {
            chai.request(app)
                .put(`/api/teachers/${testTeacher.ID_Teacher}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ Name: 'Updated Name' })
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    // expect(res.body).to.have.property('Name', 'Updated Name');
                    done();
                });
        });
    });

  describe('GET /api/teachers/name', () => {
      it('should retrieve teachers by name pattern', done => {
          chai.request(app)
              .get(`/api/teachers/name/Upda*`)
              .set('Authorization', `Bearer ${token}`)
              .end((err, res) => {
                  expect(res).to.have.status(200);
                  expect(res.body).to.be.an('array').that.is.not.empty;
                  res.body.forEach(teacher => {
                      expect(teacher.Name).to.include('Updated');
                  });
                  done();
              });
      });
  });

  describe('GET /api/teachers/specialty/:specialtyId', () => {
      it('should retrieve teachers by specialty ID', done => {
          chai.request(app)
              .get(`/api/teachers/specialty/${initialSpecialtiesIDs[0]}`)
              .set('Authorization', `Bearer ${token}`)
              .end((err, res) => {
                  expect(res).to.have.status(200);
                  expect(res.body).to.be.an('array');
                  done();
              });
      });
  });

  describe('PUT /api/teachers/update-specialty/:id', () => {
      const newSpecialtiesIDs = createdSpecialtiesIDs
                        .filter(specialty => !initialSpecialtiesIDs.includes(specialty));    
      it('should update the specialties of a teacher', done => {
          chai.request(app)
              .put(`/api/teachers/update-specialty/${testTeacher.ID_Teacher}`)
              .set('Authorization', `Bearer ${token}`)
              .send({ specialtyIds: newSpecialtiesIDs })
              .end((err, res) => {
                  expect(res).to.have.status(200);
                  expect(res.body).to.have.property('message', 'Teacher specialties updated successfully.');
                  done();
              });
      });
  });

describe('DELETE /api/teachers/:id', () => {
    it('should delete a teacher', done => {
        chai.request(app)
            .delete(`/api/teachers/${testTeacher.ID_Teacher}`)
            .set('Authorization', `Bearer ${token}`)
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.have.property('message', 'Teacher and corresponding user deleted successfully.');
                done();
            });
    });
});


  after(async () => {
    // Remover os dados criados em ordem reversa de dependência
    await Teacher.destroy({ where: { ID_Company: testCompany.ID_Company } });
    await User.destroy({ where: { ID_Company: testCompany.ID_Company } });
    await Specialty.destroy({ where: { ID_Company: testCompany.ID_Company } });
    await Company.destroy({ where: { ID_Company: testCompany.ID_Company } });
  });



});
