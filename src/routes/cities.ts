import { Router, Request, Response } from 'express'
import { randomUUID } from 'node:crypto'
import { citySchema } from '../validators.js'
import type { City } from '../types.js'
import db from '../db.js'
import type { RowDataPacket, ResultSetHeader } from 'mysql2'
import { generateETag, checkETag } from '../etag-helper.js'
import { addCityLinks, addPaginationLinks } from '../hateoas-helper.js'
import { createJob, processJob } from '../async-jobs.js'

const router = Router()

function getBaseUrl(req: Request): string {
  return `${req.protocol}://${req.get('host')}`
}

// GET
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20))
    const offset = (page - 1) * limit

    const countryCode = req.query.country_code as string
    const currency = req.query.currency as string
    const search = req.query.search as string

    const conditions: string[] = []
    const params: any[] = []

    if (countryCode) {
      conditions.push('country_code = ?')
      params.push(countryCode)
    }

    if (currency) {
      conditions.push('currency = ?')
      params.push(currency)
    }

    if (search) {
      conditions.push('name LIKE ?')
      params.push(`%${search}%`)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const [countResult] = await db.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM cities ${whereClause}`,
      params
    )
    const total = countResult[0].total

    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT id, name, country_code, currency FROM cities ${whereClause} ORDER BY name LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    )

    const etag = generateETag({ rows, total, page, limit })

    if (checkETag(req, etag)) {
      return res.status(304).end()
    }

    const baseUrl = getBaseUrl(req)
    const citiesWithLinks = rows.map((city: any) => addCityLinks(city, baseUrl))

    const response = {
      data: citiesWithLinks,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
      _links: addPaginationLinks(baseUrl, req.path, page, limit, total),
    }

    res.setHeader('ETag', etag)
    res.setHeader('Cache-Control', 'public, max-age=60')
    res.json(response)
  } catch (error) {
    console.error('Error fetching cities:', error)
    res.status(500).json({ error: 'Failed to fetch cities' })
  }
})

// GET /cities/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT id, name, country_code, currency FROM cities WHERE id = ?',
      [req.params.id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ error: 'City not found' })
    }

    const city = rows[0]
    const etag = generateETag(city)

    if (checkETag(req, etag)) {
      return res.status(304).end()
    }

    const baseUrl = getBaseUrl(req)
    const cityWithLinks = addCityLinks(city, baseUrl)

    res.setHeader('ETag', etag)
    res.setHeader('Cache-Control', 'public, max-age=60')
    res.json(cityWithLinks)
  } catch (error) {
    console.error('Error fetching city:', error)
    res.status(500).json({ error: 'Failed to fetch city' })
  }
})

// POST /cities
router.post('/', async (req: Request, res: Response) => {
  try {
    const parsed = citySchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

    const id = parsed.data.id ?? randomUUID()
    const { name, country_code, currency } = parsed.data

    await db.query<ResultSetHeader>(
      'INSERT INTO cities (id, name, country_code, currency) VALUES (?, ?, ?, ?)',
      [id, name, country_code, currency]
    )

    const city: City = { id, name, country_code, currency }
    const baseUrl = getBaseUrl(req)
    const cityWithLinks = addCityLinks(city, baseUrl)

    res.status(201)
      .location(`${baseUrl}/cities/${id}`)
      .json(cityWithLinks)
  } catch (error) {
    console.error('Error creating city:', error)
    res.status(500).json({ error: 'Failed to create city' })
  }
})

// PUT /cities/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id

    const [existing] = await db.query<RowDataPacket[]>(
      'SELECT id, name, country_code, currency FROM cities WHERE id = ?',
      [id]
    )
    if (existing.length === 0) {
      return res.status(404).json({ error: 'City not found' })
    }

    const currentEtag = generateETag(existing[0])
    const ifMatch = req.headers['if-match']
    if (ifMatch && ifMatch !== currentEtag) {
      return res.status(412).json({ error: 'Precondition Failed: Resource has been modified' })
    }

    const parsed = citySchema.partial().safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

    const updates: string[] = []
    const values: any[] = []

    if (parsed.data.name !== undefined) {
      updates.push('name = ?')
      values.push(parsed.data.name)
    }
    if (parsed.data.country_code !== undefined) {
      updates.push('country_code = ?')
      values.push(parsed.data.country_code)
    }
    if (parsed.data.currency !== undefined) {
      updates.push('currency = ?')
      values.push(parsed.data.currency)
    }

    if (updates.length > 0) {
      values.push(id)
      await db.query<ResultSetHeader>(
        `UPDATE cities SET ${updates.join(', ')} WHERE id = ?`,
        values
      )
    }

    const [updated] = await db.query<RowDataPacket[]>(
      'SELECT id, name, country_code, currency FROM cities WHERE id = ?',
      [id]
    )

    const baseUrl = getBaseUrl(req)
    const cityWithLinks = addCityLinks(updated[0], baseUrl)
    const newEtag = generateETag(updated[0])

    res.setHeader('ETag', newEtag)
    res.json(cityWithLinks)
  } catch (error) {
    console.error('Error updating city:', error)
    res.status(500).json({ error: 'Failed to update city' })
  }
})

// DELETE /cities/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const [result] = await db.query<ResultSetHeader>(
      'DELETE FROM cities WHERE id = ?',
      [req.params.id]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'City not found' })
    }

    res.status(204).send()
  } catch (error) {
    console.error('Error deleting city:', error)
    res.status(500).json({ error: 'Failed to delete city' })
  }
})

// POST /cities/batch
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { cities } = req.body

    if (!Array.isArray(cities) || cities.length === 0) {
      return res.status(400).json({ error: 'Expected an array of cities' })
    }

    const job = createJob('batch_import_cities', { cities })

    processJob(job.id, async () => {
      const results = []
      for (const cityData of cities) {
        const parsed = citySchema.safeParse(cityData)
        if (parsed.success) {
          const id = parsed.data.id ?? randomUUID()
          const { name, country_code, currency } = parsed.data

          try {
            await db.query<ResultSetHeader>(
              'INSERT INTO cities (id, name, country_code, currency) VALUES (?, ?, ?, ?)',
              [id, name, country_code, currency]
            )
            results.push({ id, status: 'created' })
          } catch (error: any) {
            results.push({ id, status: 'failed', error: error.message })
          }
        } else {
          results.push({ status: 'failed', error: 'Invalid city data' })
        }
      }
      return results
    })

    const baseUrl = getBaseUrl(req)
    res.status(202)
      .location(`${baseUrl}/jobs/${job.id}`)
      .json({
        message: 'Batch import accepted and is being processed',
        job_id: job.id,
        status: job.status,
        _links: {
          job_status: { href: `${baseUrl}/jobs/${job.id}` },
        },
      })
  } catch (error) {
    console.error('Error creating batch import job:', error)
    res.status(500).json({ error: 'Failed to create batch import job' })
  }
})

export default router