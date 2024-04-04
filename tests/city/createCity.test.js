// tests/city/createCity.test.js
const request = require('supertest');
const app = require('../../app'); // Update the path to your app.js file
const { sequelize, State } = require('../../models');

describe('POST /cities', () => {
  let validStateId;

  beforeAll(async () => {
    // Create a test state or ensure a state exists in your test database and use its ID.
    const testState = await State.create({ Name: 'TestState', Acronym: 'TS', Cod_State: '99' });
    validStateId = testState.ID_State;
  });

  afterAll(async () => {
    // Cleanup test state and close the database connection
    await State.destroy({ where: { ID_State: validStateId } });
    await sequelize.close();
  });

  it('should create a new city and return it', async () => {
    const response = await request(app)
      .post('/cities')
      .send({
        ID_State: validStateId,
        Name: 'New City',
        Cod_State: 'NC',
        Cod_City: '00001'
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('ID_City');
    expect(response.body.Name).toBe('New City');
  });

  it('should return error for invalid input', async () => {
    const response = await request(app)
      .post('/cities')
      .send({
        ID_State: validStateId,
        Name: '', // Invalid Name
        Cod_State: 'N', // Invalid Cod_State length
        Cod_City: '' // Invalid Cod_City
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  it('should return error for state not found', async () => {
    const response = await request(app)
      .post('/cities')
      .send({
        ID_State: 999999, // Assuming this ID does not exist
        Name: 'Some City',
        Cod_State: 'SC',
        Cod_City: '00002'
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('State not found.');
  });

  it('should return error for city name or code already exists in the state', async () => {
    // First, create a city to test duplication
    await request(app)
      .post('/cities')
      .send({
        ID_State: validStateId,
        Name: 'Duplicate City',
        Cod_State: 'DC',
        Cod_City: '00003'
      });

    // Try to create another city with the same name and code within the same state
    const response = await request(app)
      .post('/cities')
      .send({
        ID_State: validStateId,
        Name: 'Duplicate City', // Same Name
        Cod_State: 'DC', // Same Cod_State
        Cod_City: '00003' // Same Cod_City
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('A city with the same name or code already exists in the state.');
  });

  // Add more tests as needed for other scenarios
});
