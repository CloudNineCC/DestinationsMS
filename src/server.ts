import 'dotenv/config'
import app from './app.js'

const port = process.env.PORT ? Number(process.env.PORT) : 3001
const host = process.env.HOST || '0.0.0.0'

app.listen(port, host, () => {
  console.log(`ms-destinations listening on http://${host}:${port}`)
})
