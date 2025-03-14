// timeTableController.test.js
console.log(`TIME TABLE TEST - BEGIN`)
const dotenv = require('dotenv');
const { Sequelize, DataTypes } = require('sequelize');
const { customLogger } = require('../../utils/logHelpers.js');
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
const Teacher = require('../../models/teacher.js')(sequelize, DataTypes);
const Specialty = require('../../models/specialty.js')(sequelize, DataTypes);
const TimeTable = require('../../models/timeTable.js')(sequelize, DataTypes);

const app = require('../../app');
const chai = require('chai');
const chaiHttp = require('chai-http');
const { expect } = chai;
chai.use(chaiHttp);

describe(' TESTE -TimeTable Controller', () => {
    let token = '';
    let testCompany, testUser, testTeacher, testSpecialty, testClient;
    let testTimeTable;

    before(async () => {
        testCompany = await Company.create({ Name: 'Test Company' });
        if (!testCompany) {
            throw new Error('ABORTED: Failed to create test Company');
        }
        console.log(`Company created ID=${testCompany.ID_Company}`)

        const password = await bcrypt.hash('12345678', 10);
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

        testTeacher = await Teacher.create({
            Name: 'Test Teacher',
            ID_User: testUser.ID_User,
            ID_Company: testCompany.ID_Company
        });
        if (!testTeacher) {
            throw new Error('ABORTED: Failed to create test teacher');
        }
        console.log(`Teacher created ID=${testTeacher.ID_Teacher}`)

        testSpecialty = await Specialty.create({
            Description: 'Yoga',
            ID_Company: testCompany.ID_Company
        });
        if (!testSpecialty) {
            throw new Error('ABORTED: Failed to create test specialty');
        }
        console.log(`Specialty created ID=${testSpecialty.ID_Specialties}`)

        await sequelize.models.TeacherSpecialties.create({
            ID_Teacher: testTeacher.ID_Teacher,
            ID_Specialties: testSpecialty.ID_Specialties
        });

        testClient = await Client.create({
            Name: 'Test Client',
            Email: 'testclient@test.com',
            CPF: '12345678901',
            ID_City: 1,
            ID_Company: testCompany.ID_Company,
            ID_User: testUser.ID_User
        });
        if (!testClient) {
            throw new Error('ABORTED: Failed to create test client');
        }
        console.log(`Client created ID=${testClient.ID_Client}`)

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

    describe(' TESTE -POST /api/timetables', () => {
        it('should create a timetable', (done) => {
            chai.request(app)
                .post('/api/timetables')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    ID_Teacher: testTeacher.ID_Teacher,
                    Day_of_Week: 'Monday',
                    Start_Time: '08:00',
                    End_Time: '10:00',
                    Capacity: 10,
                    ID_Specialty: testSpecialty.ID_Specialties
                })
                .end((err, res) => {
                    testTimeTable = res.body;
                    expect(res).to.have.status(201);
                    expect(res.body).to.have.property('ID_Teacher', testTeacher.ID_Teacher);
                    done();
                });
        });
    });

    describe(' TESTE -GET /api/timetables', () => {
        it('should retrieve all timetables for a company', (done) => {
            chai.request(app)
                .get('/api/timetables')
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('array');
                    done();
                });
        });
    });

    describe(' TESTE -GET /api/timetables/:id', () => {
        it('should retrieve a specific timetable by ID', (done) => {
            chai.request(app)
                .get(`/api/timetables/${testTimeTable.ID_TimeTable}`)
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.property('ID_TimeTable', testTimeTable.ID_TimeTable);
                    done();
                });
        });
    });

    describe(' TESTE -PUT /api/timetables/:id', () => {
        it('should update a timetable', (done) => {
            chai.request(app)
                .put(`/api/timetables/${testTimeTable.ID_TimeTable}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ Capacity: 15 })
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.property('message', 'TimeTable record updated successfully.');
                    done();
                });
        });
    });

    describe(' TESTE -DELETE /api/timetables/:id', () => {
        it('should delete a timetable', (done) => {
            chai.request(app)
                .delete(`/api/timetables/${testTimeTable.ID_TimeTable}`)
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.property('message', 'TimeTable record deleted successfully.');
                    done();
                });
        });
    });

    after(async () => {
        // Remover os dados criados em ordem reversa de dependência
        await sequelize.models.TeacherSpecialties.destroy({ where: { ID_Teacher: testTeacher.ID_Teacher } });
        await TimeTable.destroy({ where: { ID_Teacher: testTeacher.ID_Teacher } });
        await Teacher.destroy({ where: { ID_Company: testCompany.ID_Company } });
        await Client.destroy({ where: { ID_Company: testCompany.ID_Company } });
        await Specialty.destroy({ where: { ID_Company: testCompany.ID_Company } });
        await User.destroy({ where: { ID_Company: testCompany.ID_Company } });
        await Company.destroy({ where: { ID_Company: testCompany.ID_Company } });
    });
});
