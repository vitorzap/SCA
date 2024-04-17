// tests/updateCity.test.js
describe('PUT /cities/:id', () => {
  it('should update the city details', async () => {
    const response = await request(app)
      .put('/cities/1')
      .send({
        Name: 'Updated City',
        Cod_State: 'UC',
        Cod_City: '67890'
      });
    
    expect(response.status).to.equal(200);
    expect(response.body.message).to.equal('City updated successfully.');
  });
});
