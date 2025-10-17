import { Router, Request, Response } from 'express'
import { randomUUID } from 'node:crypto'
import { citySchema } from '../validators'
import type { City } from '../types'

const router = Router()
const cities = new Map<string, City>()

router.get('/', (_req: Request, res: Response) => {
  res.json(Array.from(cities.values()))
})

router.post('/', (req: Request, res: Response) => {
  const parsed = citySchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const id = parsed.data.id ?? randomUUID()
  const { name, country_code, currency } = parsed.data
  const city: City = { id, name, country_code, currency }
  cities.set(id, city)
  res.status(201).json(city)
})

router.put('/:id', (req: Request, res: Response) => {
  const id = req.params.id
  if (!cities.has(id)) return res.status(404).json({ error: 'City not found' })
  const parsed = citySchema.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const existing = cities.get(id)!
  const updated = { ...existing, ...parsed.data, id }
  cities.set(id, updated)
  res.json(updated)
})

router.delete('/:id', (req: Request, res: Response) => {
  const ok = cities.delete(req.params.id)
  if (!ok) return res.status(404).json({ error: 'City not found' })
  res.status(204).send()
})

export default router
