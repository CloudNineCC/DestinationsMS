import { Router, Request, Response } from 'express'
import { getJob } from '../async-jobs.js'

const router = Router()

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const job = getJob(req.params.id)

    if (!job) {
      return res.status(404).json({ error: 'Job not found' })
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`
    const response: any = {
      id: job.id,
      type: job.type,
      status: job.status,
      created_at: job.created_at,
      updated_at: job.updated_at,
      _links: {
        self: { href: `${baseUrl}/jobs/${job.id}` },
      },
    }

    if (job.status === 'completed' && job.result) {
      response.result = job.result
    }

    if (job.status === 'failed' && job.error) {
      response.error = job.error
    }

    if (job.status === 'completed') {
      res.status(200).json(response)
    } else if (job.status === 'failed') {
      res.status(200).json(response)
    } else {
      res.status(200).json(response)
    }
  } catch (error) {
    console.error('Error fetching job:', error)
    res.status(500).json({ error: 'Failed to fetch job status' })
  }
})

export default router
