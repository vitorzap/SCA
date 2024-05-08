console.log(`SESSION TEST - BEGIN`)
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Sequelize, DataTypes } = require('sequelize');
const customLogger = require('../../utils/logHelpers.js');

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
chai.use(chaiHttp);

var newCompany, newUser;
var token;

describe('Session Controller', () => {
    before(async () => {
        newCompany = await Company.create({
            Name: 'testCompany',
        })
        if (! newCompany) {
          throw new Error('ABORTED: Failed to create test Company');
        }
        console.log(`Company created ID=${newCompany.ID_Company}`)

        const password = await bcrypt.hash('12345678', 10);
        newUser = await User.create({
            UserName: 'testuser',
            UserEmail: 'test@example.com',
            UserPassword: password,
            UserType: 'Admin',
            ID_Company: newCompany.ID_Company
        });
        if (!newUser) {
            throw new Error('ABORTED: Failed to create test user');
          }
          console.log(`User created ID=${newUser.UserID}`)
    });

    describe('POST /login', () => {
        it('should login the user and return JWT token', (done) => {
            chai.request(app)
                .post('/api/login')
                .send({ login: 'test@example.com', UserPassword: '12345678', ID_Company: newCompany.ID_Company })
                .end((err, res) => {
                    chai.expect(res).to.have.status(200);
                    chai.expect(res.body).to.have.property('token');
                    token = res.body.token; 
                    done();
                });
        });

        it('should not login the user with wrong password', (done) => {
            chai.request(app)
                .post('/api/login')
                .send({ login: 'test@example.com', UserPassword: 'wrongpassword', ID_Company: newCompany.ID_Company })
                .end((err, res) => {
                    chai.expect(res).to.have.status(401);
                    chai.expect(res.body).to.have.property('error');
                    done();
                });
        });
    });

    describe('POST /logout', () => {
        it('should logout the user and blacklist token', (done) => {
            chai.request(app)
                .post('/api/logout')
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    chai.expect(res).to.have.status(200);
                    chai.expect(res.body).to.have.property('message');
                    done();
                });
        });
    });

    describe('POST /changePassword', () => {
        it('should change the user password', (done) => {
            chai.request(app)
                .post('/api/changePassword')
                .set('Authorization', `Bearer ${token}`)
                .send({ oldPassword: '12345678', newPassword: 'newpassword123', ID_Company: newCompany.ID_Company })
                .end((err, res) => {
                    chai.expect(res).to.have.status(200);
                    chai.expect(res.body).to.have.property('message');
                    done();
                });
        });
    });

    describe('POST /login - new password', () => {
        it('should login the user with new password and return JWT token', (done) => {
            chai.request(app)
                .post('/api/login')
                .send({ login: 'test@example.com', UserPassword: 'newpassword123', ID_Company: newCompany.ID_Company })
                .end((err, res) => {
                    chai.expect(res).to.have.status(200);
                    chai.expect(res.body).to.have.property('token');
                    done();
                });
        });
    });

    after(async () => {
        // Clean up the database or any other resources after tests are done
        await User.destroy({ where: { UserEmail: 'test@example.com' } });
        await Company.destroy({ where: {ID_Company: newCompany.ID_Company} })
    });
});
