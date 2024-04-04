// tests/listAllCities.test.js
describe('GET /cities', () => {
  it('should list all cities', async () => {
    const response = await request(app).get('/cities');
    expect(response.status).to.equal(200);
    expect(response.body).to.be.an('array');
  });
});
