import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import citiesRouter from './routes/cities.js'
import seasonsRouter from './routes/seasons.js'
import jobsRouter from './routes/jobs.js'

const app = express()
app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ms-destinations' })
})

app.use('/cities', citiesRouter)
app.use('/seasons', seasonsRouter)
app.use('/jobs', jobsRouter)

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' })
})

export default app
