console.log(`USER TEST - BEGIN`)
const dotenv = require('dotenv');
const chai = require('chai');
const chaiHttp = require('chai-http');
const bcrypt = require('bcrypt');

const { User, Company, UserType } = require('../../models');

dotenv.config();
chai.use(chaiHttp);

let app
let newCompany, newUser;
let token;
let password;

// Dados para teste
const userData = {
  UserName: 'NewAdmin',
  UserEmail: 'adteste@example.com',
  UserPassword: 'password123',
  ID_UserType: 1
};


describe(' TESTE -User Controller', () => {
    before(async () => { 
      const createApp = require('../../app.js'); 
      app = await createApp()

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
          ID_UserType: 1,
          ID_Company: newCompany.ID_Company
      });
      if (!newUser) {
        throw new Error('ABORTED: Failed to create test user');
      }
      console.log(`User created ID=${newUser.ID_User}`)

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

        try {
          const user = await User.findOne({ 
            where: { ID_User: newUser.ID_User }, 
            include: [{ model: UserType }] 
          });
        } catch(erro) {
          console.log(`ERRO: ${erro.message}`)
        }
    });  

    after(async () => {
      // Clean up the database or any other resources after tests are done
      await User.destroy({ where: { UserEmail: 'test@example.com' } });
      await User.destroy({ where: { UserEmail: 'adteste@example.com' } });
      await Company.destroy({ where: {ID_Company: newCompany.ID_Company} })
    });
    
    describe(' TESTE -POST /api/users', () => { 
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

    describe(' TESTE -GET /api/users', () => {
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

    describe(' TESTE -GET /api/users/:id', () => {
      it('should retrieve a user by id', (done) => {
          chai.request(app)
              .get(`/api/users/${newUser.ID_User}`) 
              .set('Authorization', `Bearer ${token}`)
              .end((err, res) => {
                  chai.expect(res).to.have.status(200);
                  chai.expect(res.body).to.have.property('UserName');
                  chai.expect(res.body.UserName).equal(newUser.UserName);
                  done();
              });
      });
    });

    describe(' TESTE -GET /api/users/name/:name', () => {
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
    
    describe(' TESTE -PUT /api/users/:id- Update user name', () => {
      it('should update a user', (done) => {
          chai.request(app)
              .put(`/api/users/${newUser.ID_User}`) 
              .set('Authorization', `Bearer ${token}`)
              .send({ UserName: 'UpdatedName' })
              .end((err, res) => {
                  chai.expect(res).to.have.status(200);
                  chai.expect(res.body).to.have.property('UserName')
                                         .that.equals('UpdatedName'); 
                  done();
              });
      });
    });


    describe(' TESTE -PUT /api/users/:id - Update user email', () => {
      it('should update the user email', (done) => {
        chai.request(app)
            .put(`/api/users/${newUser.ID_User}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ UserEmail: 'newemail@example.com' })
            .end((err, res) => {
                chai.expect(res).to.have.status(200);
                chai.expect(res.body).to.have.property('UserEmail')
                .that.equals('newemail@example.com'); 
                done();
            });
      });
    });

    describe(' TESTE -DELETE /api/users/:id', () => {
      it('should delete a user', (done) => {
          chai.request(app)
              .delete(`/api/users/${newUser.ID_User}`) 
              .set('Authorization', `Bearer ${token}`)
              .end((err, res) => {
                  chai.expect(res).to.have.status(200);
                  chai.expect(res.body).to.have.property('message');
                  done();
              });
      });
    });

});
