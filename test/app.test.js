process.env.DB_PATH = ':memory:';

const { describe, beforeEach, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('../src/app');
const db = require('../src/db');

describe('Destinations service', () => {
  beforeEach(() => {
    db.exec('DELETE FROM seasons; DELETE FROM cities;');
  });

  it('responds to health check', async () => {
    const res = await request(app).get('/healthz');
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.status, 'ok');
  });

  it('allows CRUD operations on cities', async () => {
    const create = await request(app)
      .post('/cities')
      .send({ name: 'Paris', country_code: 'fr', currency: 'eur' });
    assert.equal(create.statusCode, 201);
    assert.ok(create.body.id);
    assert.equal(create.body.name, 'Paris');
    assert.equal(create.body.country_code, 'FR');
    assert.equal(create.body.currency, 'EUR');

    const list = await request(app).get('/cities');
    assert.equal(list.statusCode, 200);
    assert.equal(list.body.length, 1);

    const fetch = await request(app).get(`/cities/${create.body.id}`);
    assert.equal(fetch.statusCode, 200);
    assert.equal(fetch.body.id, create.body.id);

    const update = await request(app)
      .put(`/cities/${create.body.id}`)
      .send({ name: 'Paris', country_code: 'fr', currency: 'usd' });
    assert.equal(update.statusCode, 200);
    assert.equal(update.body.currency, 'USD');

    const deletion = await request(app).delete(`/cities/${create.body.id}`);
    assert.equal(deletion.statusCode, 204);
  });

  it('validates seasons against cities and lists by city', async () => {
    const city = await request(app)
      .post('/cities')
      .send({ name: 'Tokyo', country_code: 'jp', currency: 'jpy' });
    assert.equal(city.statusCode, 201);

    const season = await request(app)
      .post('/seasons')
      .send({
        city_id: city.body.id,
        season_name: 'peak',
        start_month: 3,
        end_month: 5,
      });
    assert.equal(season.statusCode, 201);
    assert.equal(season.body.city_id, city.body.id);

    const list = await request(app).get('/seasons');
    assert.equal(list.statusCode, 200);
    assert.equal(list.body.length, 1);

    const byCity = await request(app).get(`/cities/${city.body.id}/seasons`);
    assert.equal(byCity.statusCode, 200);
    assert.equal(byCity.body.length, 1);

    const filtered = await request(app).get(`/seasons`).query({ city_id: city.body.id });
    assert.equal(filtered.statusCode, 200);
    assert.equal(filtered.body.length, 1);
  });
});
