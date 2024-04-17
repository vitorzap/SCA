// tests/getCityById.test.js
describe('GET /cities/:id', () => {
  it('should return a city by ID', async () => {
    const response = await request(app).get('/cities/1');
    expect(response.status).to.equal(200);
    expect(response.body).to.have.property('ID_City');
  });
});
