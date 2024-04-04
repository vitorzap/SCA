// tests/deleteCity.test.js
describe('DELETE /cities/:id', () => {
  it('should delete a city', async () => {
    const response = await request(app).delete('/cities/1');
    expect(response.status).to.equal(200);
    expect(response.body.message).to.equal('City deleted successfully.');
  });
});
