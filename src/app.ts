import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import citiesRouter from './routes/cities'
import seasonsRouter from './routes/seasons'

const app = express()
app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ms-destinations' })
})

app.use('/cities', citiesRouter)
app.use('/seasons', seasonsRouter)

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' })
})

export default app
