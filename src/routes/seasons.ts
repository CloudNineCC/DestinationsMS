import { Router, Request, Response } from 'express'
import { randomUUID } from 'node:crypto'
import { seasonSchema } from '../validators.js'
import type { Season } from '../types.js'
import db from '../db.js'
import type { RowDataPacket, ResultSetHeader } from 'mysql2'

const router = Router()

router.get('/', async (_req: Request, res: Response) => {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT id, city_id, season_name, start_month, end_month FROM seasons ORDER BY city_id, start_month'
    )
    res.json(rows)
  } catch (error) {
    console.error('Error fetching seasons:', error)
    res.status(500).json({ error: 'Failed to fetch seasons' })
  }
})

router.post('/', async (req: Request, res: Response) => {
  try {
    const parsed = seasonSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

    const id = parsed.data.id ?? randomUUID()
    const { city_id, season_name, start_month, end_month } = parsed.data

    await db.query<ResultSetHeader>(
      'INSERT INTO seasons (id, city_id, season_name, start_month, end_month) VALUES (?, ?, ?, ?, ?)',
      [id, city_id, season_name, start_month, end_month]
    )

    const season: Season = { id, city_id, season_name, start_month, end_month }
    res.status(201).json(season)
  } catch (error) {
    console.error('Error creating season:', error)
    res.status(500).json({ error: 'Failed to create season' })
  }
})

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id

    const [existing] = await db.query<RowDataPacket[]>(
      'SELECT id, city_id, season_name, start_month, end_month FROM seasons WHERE id = ?',
      [id]
    )
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Season not found' })
    }

    const parsed = seasonSchema.partial({ id: true }).safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

    const updates: string[] = []
    const values: any[] = []

    if (parsed.data.city_id !== undefined) {
      updates.push('city_id = ?')
      values.push(parsed.data.city_id)
    }
    if (parsed.data.season_name !== undefined) {
      updates.push('season_name = ?')
      values.push(parsed.data.season_name)
    }
    if (parsed.data.start_month !== undefined) {
      updates.push('start_month = ?')
      values.push(parsed.data.start_month)
    }
    if (parsed.data.end_month !== undefined) {
      updates.push('end_month = ?')
      values.push(parsed.data.end_month)
    }

    if (updates.length > 0) {
      values.push(id)
      await db.query<ResultSetHeader>(
        `UPDATE seasons SET ${updates.join(', ')} WHERE id = ?`,
        values
      )
    }

    const [updated] = await db.query<RowDataPacket[]>(
      'SELECT id, city_id, season_name, start_month, end_month FROM seasons WHERE id = ?',
      [id]
    )
    res.json(updated[0])
  } catch (error) {
    console.error('Error updating season:', error)
    res.status(500).json({ error: 'Failed to update season' })
  }
})

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const [result] = await db.query<ResultSetHeader>(
      'DELETE FROM seasons WHERE id = ?',
      [req.params.id]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Season not found' })
    }

    res.status(204).send()
  } catch (error) {
    console.error('Error deleting season:', error)
    res.status(500).json({ error: 'Failed to delete season' })
  }
})

export default router
