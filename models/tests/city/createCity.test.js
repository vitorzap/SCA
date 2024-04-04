// tests/createCity.test.js
const request = require('supertest');
const { expect } = require('chai');
const app = require('../app'); // Adjust the path to where your Express app is exported

describe('POST /cities', () => {
  it('should create a new city and return it', async () => {
    const response = await request(app)
      .post('/cities')
      .send({
        ID_State: 1,
        Name: 'Test City',
        Cod_State: 'TS',
        Cod_City: '12345'
      });
    
    expect(response.status).to.equal(201);
    expect(response.body).to.include({
      Name: 'Test City',
      Cod_State: 'TS',
      Cod_City: '12345'
    });
  });
});
