import { randomUUID } from 'crypto'

interface Job {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  type: string
  data?: any
  result?: any
  error?: string
  created_at: Date
  updated_at: Date
}

const jobs = new Map<string, Job>()

export function createJob(type: string, data: any): Job {
  const job: Job = {
    id: randomUUID(),
    status: 'pending',
    type,
    data,
    created_at: new Date(),
    updated_at: new Date(),
  }
  jobs.set(job.id, job)
  return job
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id)
}

export function updateJobStatus(id: string, status: Job['status'], result?: any, error?: string) {
  const job = jobs.get(id)
  if (job) {
    job.status = status
    job.updated_at = new Date()
    if (result !== undefined) job.result = result
    if (error !== undefined) job.error = error
  }
}

export function processJob(jobId: string, processor: () => Promise<any>) {
  setImmediate(async () => {
    updateJobStatus(jobId, 'processing')
    try {
      const result = await processor()
      updateJobStatus(jobId, 'completed', result)
    } catch (error: any) {
      updateJobStatus(jobId, 'failed', undefined, error.message)
    }
  })
}