import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import swaggerUi from 'swagger-ui-express'
import citiesRouter from './routes/cities.js'
import seasonsRouter from './routes/seasons.js'
import jobsRouter from './routes/jobs.js'
import { generateOpenAPISpec } from './openapi-generator.js'

const app = express()
app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ms-destinations' })
})

const openApiSpec = generateOpenAPISpec()
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec))
app.get('/openapi.json', (_req, res) => {
  res.json(openApiSpec)
})

app.use('/cities', citiesRouter)
app.use('/seasons', seasonsRouter)
app.use('/jobs', jobsRouter)

app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' })
})

export default app
