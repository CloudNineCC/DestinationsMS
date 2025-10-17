import request from 'supertest'
import app from '../src/app'

type CityOut = { id: string; name: string; country_code: string; currency: string }

describe('ms-destinations', () => {
  it('health check', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })

  it('CRUD cities', async () => {
    const create = await request(app)
      .post('/cities')
      .send({ name: 'Paris', country_code: 'FR', currency: 'EUR' })
    expect(create.status).toBe(201)
    const id = create.body.id

  const list = await request(app).get('/cities')
  const found = (list.body as CityOut[]).find((c) => c.id === id)!
  expect(found.name).toBe('Paris')

    const update = await request(app).put(`/cities/${id}`).send({ currency: 'USD' })
    expect(update.body.currency).toBe('USD')

    const del = await request(app).delete(`/cities/${id}`)
    expect(del.status).toBe(204)
  })
})
