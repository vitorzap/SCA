console.log(`USER TEST - BEGIN`)
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
var password;

// Dados para teste
const userData = {
  UserName: 'NewAdmin',
  UserEmail: 'adteste@example.com',
  UserPassword: 'password123',
  UserType: 'Admin'
};


describe('User Controller', () => {
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
            UserType: 'Admin',
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
    
    describe('POST /api/users', () => { 
      it('should create a user and return the user object', (done) => {
        chai.request(app)
          .post('/api/users')
          .set('Authorization', `Bearer ${token}`)
          .send(userData)
          .end((err, res) => {
            chai.expect(res).to.have.status(201);
            chai.expect(res.body.UserName).equal(userData.UserName);
            done();   
          });       
      });
      it('should return a 400 status if the user already exists', (done) => {
        chai.request(app)
          .post('/api/users')
          .set('Authorization', `Bearer ${token}`)
          .send(userData)
          .end((err, res) => {
            chai.expect(res).to.have.status(400);
            done();   
          });  
      });
    });

    describe('GET /api/users', () => {
      it('should retrieve all users', (done) => {
          chai.request(app)
              .get('/api/users')
              .set('Authorization', `Bearer ${token}`)
              .end((err, res) => {
                  chai.expect(res).to.have.status(200);
                  chai.expect(res.body).to.be.an('array');
                  done();
              });
      });
    });

    describe('GET /api/users/:id', () => {
      it('should retrieve a user by id', (done) => {
          chai.request(app)
              .get(`/api/users/${newUser.UserID}`) 
              .set('Authorization', `Bearer ${token}`)
              .end((err, res) => {
                  chai.expect(res).to.have.status(200);
                  chai.expect(res.body).to.have.property('UserName');
                  chai.expect(res.body.UserName).equal(newUser.UserName);
                  done();
              });
      });
    });

    describe('GET /api/users/name/:name', () => {
      it('should find users with exact name', (done) => {
          chai.request(app)
              .get(`/api/users/name/${newUser.UserName}`)
              .set('Authorization', `Bearer ${token}`)
              .end((err, res) => {
                  chai.expect(res).to.have.status(200);
                  chai.expect(res.body).to.be.an('array');
                  chai.expect(res.body[0].UserName).to.equal(newUser.UserName);
                  done();
              });
      });

      it('should find users whose names start with a given pattern', (done) => {
          chai.request(app)
              .get(`/api/users/name/New*`)
              .set('Authorization', `Bearer ${token}`)
              .end((err, res) => {
                  chai.expect(res).to.have.status(200);
                  chai.expect(res.body).to.be.an('array');
                  chai.expect(res.body.length).to.be.at.least(1);
                  done();
              });
      });

      it('should find users whose names end with a given pattern', (done) => {
          chai.request(app)
              .get(`/api/users/name/*min`)
              .set('Authorization', `Bearer ${token}`)
              .end((err, res) => {
                  chai.expect(res).to.have.status(200);
                  chai.expect(res.body).to.be.an('array');
                  done();
              });
      });

      it('should find users whose names contain a given pattern', (done) => {
          chai.request(app)
              .get(`/api/users/name/*Admin*`)
              .set('Authorization', `Bearer ${token}`)
              .end((err, res) => {
                  chai.expect(res).to.have.status(200);
                  chai.expect(res.body).to.be.an('array');
                  done();
              });
      });
    });
    
    describe('PUT /api/users/:id- Update user name', () => {
      it('should update a user', (done) => {
          chai.request(app)
              .put(`/api/users/${newUser.UserID}`) 
              .set('Authorization', `Bearer ${token}`)
              .send({ UserName: 'UpdatedName' })
              .end((err, res) => {
                  chai.expect(res).to.have.status(200);
                  chai.expect(res.body).to.have.property('message');
                  done();
              });
      });
    });


    describe('PUT /api/users/:id - Update user email', () => {
      it('should update the user email', (done) => {
        chai.request(app)
            .put(`/api/users/${newUser.UserID}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ UserEmail: 'newemail@example.com' })
            .end((err, res) => {
                chai.expect(res).to.have.status(200);
                chai.expect(res.body).to.have.property('message', 'User updated successfully');
                done();
            });
      });
    });

    describe('DELETE /api/users/:id', () => {
      it('should delete a user', (done) => {
          chai.request(app)
              .delete(`/api/users/${newUser.UserID}`) 
              .set('Authorization', `Bearer ${token}`)
              .end((err, res) => {
                  chai.expect(res).to.have.status(200);
                  chai.expect(res.body).to.have.property('message');
                  done();
              });
      });
    });

    after(async () => {
        // Clean up the database or any other resources after tests are done
        await User.destroy({ where: { UserEmail: 'test@example.com' } });
        await User.destroy({ where: { UserEmail: 'adteste@example.com' } });
        await Company.destroy({ where: {ID_Company: newCompany.ID_Company} })
    });

});
