import { Router, Request, Response } from 'express'
import { randomUUID } from 'node:crypto'
import { seasonSchema } from '../validators'
import type { Season } from '../types'

const router = Router()
const seasons = new Map<string, Season>()

router.get('/', (_req: Request, res: Response) => {
  res.json(Array.from(seasons.values()))
})

router.post('/', (req: Request, res: Response) => {
  const parsed = seasonSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const id = parsed.data.id ?? randomUUID()
  const { city_id, season_name, start_month, end_month } = parsed.data
  const season: Season = { id, city_id, season_name, start_month, end_month }
  seasons.set(id, season)
  res.status(201).json(season)
})

router.put('/:id', (req: Request, res: Response) => {
  const id = req.params.id
  if (!seasons.has(id)) return res.status(404).json({ error: 'Season not found' })
  const parsed = seasonSchema.partial({ id: true }).safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const existing = seasons.get(id)!
  const updated = { ...existing, ...parsed.data, id }
  seasons.set(id, updated)
  res.json(updated)
})

router.delete('/:id', (req: Request, res: Response) => {
  const ok = seasons.delete(req.params.id)
  if (!ok) return res.status(404).json({ error: 'Season not found' })
  res.status(204).send()
})

export default router
