const fs = require('fs');
const path = require('path');

var dirInit=__dirname;
var files = fs.readdirSync(dirInit);
while ((files.indexOf('index.js') == -1) && (dirInit!=="/")) {
   dirInit=path.dirname(dirInit);
   files = fs.readdirSync(dirInit);
}

const { Sequelize, DataTypes } = require('sequelize');

const dotenv = require('dotenv');
dotenv.config();

const env = process.env.NODE_ENV || 'development';
const config = require(path.join(dirInit, 'config/config.json'))[env];

const sequelize = new Sequelize(config.database, config.username, config.password, config);
const User = require(path.join(dirInit, 'models/user'))(sequelize, DataTypes);

// const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = require( path.join(dirInit, 'index'));
// const chai = require('chai');
// const chaiHttp = require('chai-http');
// chai.use(chaiHttp);
import chai from 'chai';
import chaiHttp from 'chai-http';

chai.use(chaiHttp);
// let chai, chaiHttp;

// before(async () => {
//   chai = await import('chai');
//   chaiHttp = require('chai-http');


//   chai.use(chaiHttp); // Use default if it exists, otherwise use the module directly
// });


describe('Session Controller', () => {
    before(async () => {
        // Set up here any preparation necessary before running the tests
        // For example, adding a test user in the database
        const password = await bcrypt.hash('12345678', 10);
        await User.create({
            UserName: 'testuser',
            UserEmail: 'test@example.com',
            UserPassword: password,
            UserType: 'Admin',
            ID_Company: 1
        });
    });

    describe('POST /login', () => {
        it('should login the user and return JWT token', (done) => {
            chai.request(app)
                .post('/login')
                .send({ UserEmail: 'test@example.com', UserPassword: '12345678' })
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.property('token');
                    done();
                });
        });

        it('should not login the user with wrong password', (done) => {
            chai.request(app)
                .post('/login')
                .send({ UserEmail: 'test@example.com', UserPassword: 'wrongpassword' })
                .end((err, res) => {
                    expect(res).to.have.status(401);
                    expect(res.body).to.have.property('error');
                    done();
                });
        });
    });

    describe('POST /logout', () => {
        it('should logout the user and blacklist token', (done) => {
            const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET, { expiresIn: '1h' }); // Adjust payload and secret as necessary
            chai.request(app)
                .post('/logout')
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.property('message');
                    done();
                });
        });
    });

    describe('POST /changePassword', () => {
        it('should change the user password', (done) => {
            const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET, { expiresIn: '1h' });
            chai.request(app)
                .post('/changePassword')
                .set('Authorization', `Bearer ${token}`)
                .send({ oldPassword: '12345678', newPassword: 'newpassword123' })
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.property('message');
                    done();
                });
        });
    });

    after(async () => {
        // Clean up the database or any other resources after tests are done
        await User.destroy({ where: { UserEmail: 'test@example.com' } });
    });
});
