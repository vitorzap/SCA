console.log('SESSION TEST - BEGIN');
const dotenv = require('dotenv');
const chai = require('chai');
const chaiHttp = require('chai-http');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, Company } = require('../../models'); // Your Sequelize models

dotenv.config();
chai.use(chaiHttp);

let app
let newCompany;
let newUser;
let token;

describe(' TESTE -Session Controller', function () {
  before(async () => {
    const createApp = require('../../app.js'); 
    app = await createApp()

    // Create a new company and a user before the tests
    newCompany = await Company.create({
      Name: 'testCompany',
    });

    const hashedPassword = await bcrypt.hash('12345678', 10);
    newUser = await User.create({
      UserName: 'testuser',
      UserEmail: 'testuser@example.com',
      UserPassword: hashedPassword,
      ID_UserType: 1, // Assuming 1 is a valid UserType ID
      ID_Company: newCompany.ID_Company,
    });

  });

  after(async () => {
    // Cleanup the created user and company after the tests
    await User.destroy({ where: { UserEmail: 'testuser@example.com' } });
    await Company.destroy({ where: { ID_Company: newCompany.ID_Company } });
  })

  describe(' TESTE -POST /login', () => {
    it('should login the user and return JWT token', (done) => {
      chai.request(app)
        .post('/api/login')
        .send({
          login: 'testuser@example.com',
          UserPassword: '12345678',
          ID_Company: newCompany.ID_Company
        })
        .end((err, res) => {
          chai.expect(res).to.have.status(200);
          chai.expect(res.body).to.have.property('token');
          token = res.body.token; // Save the token for further requests
          done();
        });
    });
    it('should not login the user with wrong password', (done) => {
      chai.request(app)
        .post('/api/login')
        .send({
          login: 'testuser@example.com',
          UserPassword: 'wrongpassword',
          ID_Company: newCompany.ID_Company
        })
        .end((err, res) => {
          chai.expect(res).to.have.status(401);
          chai.expect(res.body).to.have.property('error').that.equals('Incorrect password');
          done();
        });
    });
  });

  describe(' TESTE -POST /logout', () => {
    it('should logout the user and blacklist the token', (done) => {
      chai.request(app)
        .post('/api/logout')
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          chai.expect(res).to.have.status(200);
          chai.expect(res.body).to.have.property('message').that.equals('Logout successful');
          done(); 
        });
    });
  });

  describe(' TESTE -POST /changePassword with blacklisted token', () => {
    it('should not change the user password due to blacklisted token', (done) => {
      chai.request(app)
        .post('/api/changePassword')
        .set('Authorization', `Bearer ${token}`) // This token is blacklisted after logout
        .send({
          oldPassword: '12345678',
          newPassword: 'newpassword123',
        })
        .end((err, res) => {
          chai.expect(res).to.have.status(401); // Expect failure due to blacklisted token
          chai.expect(res.body).to.have.property('error').that.equals('Token is blacklisted');
          done();
        });
    });
  });

  describe(' TESTE -POST /login to get new token after logout', () => {
    it('should login the user and return JWT token after logout', (done) => {
      chai.request(app)
        .post('/api/login')
        .send({
          login: 'testuser@example.com',
          UserPassword: '12345678',
          ID_Company: newCompany.ID_Company
        })
        .end((err, res) => {
          chai.expect(res).to.have.status(200);
          chai.expect(res.body).to.have.property('token');
          token = res.body.token; // Save the new token for further requests
          done();
        });
    });
  });

  describe(' TESTE -POST /changePassword', () => {
    it('should change the user password', (done) => {
      chai.request(app)
        .post('/api/changePassword')
        .set('Authorization', `Bearer ${token}`)
        .send({
          oldPassword: '12345678',
          newPassword: 'newpassword123',
        })
        .end((err, res) => {
          chai.expect(res).to.have.status(200);
          chai.expect(res.body).to.have.property('message').that.equals('Password changed successfully');
          done();
        });
    });
  });

  describe(' TESTE -POST /login with new password', () => {
    it('should login the user with the new password and return JWT token', (done) => {
      chai.request(app)
        .post('/api/login')
        .send({
          login: 'testuser@example.com',
          UserPassword: 'newpassword123',
          ID_Company: newCompany.ID_Company
        })
        .end((err, res) => {
          chai.expect(res).to.have.status(200);
          chai.expect(res.body).to.have.property('token');
          done();
        });
    });
  });
})