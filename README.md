DestinationsMS


Run it
- cd DestinationsMS
- npm install
- npm run dev (opens http://localhost:3001)
- npm test

Check it
- GET /health returns { status: "ok", service: "ms-destinations" }

Data shapes
- City: { id, name, country_code, currency }
- Season: { id, city_id, season_name: 'peak' | 'shoulder' | 'off', start_month, end_month }

API
- GET /cities
- POST /cities { name, country_code (2 letters), currency (3 letters) }
- PUT /cities/{id} { partial fields }
- DELETE /cities/{id}
- GET /seasons
- POST /seasons { city_id, season_name, start_month (1-12), end_month (1-12) }
- PUT /seasons/{id} { partial fields }
- DELETE /seasons/{id}

Examples (PowerShell)
- Create a city
  $body = @{ name='Paris'; country_code='FR'; currency='EUR' } | ConvertTo-Json
  Invoke-RestMethod -Method Post -Uri 'http://localhost:3001/cities' -ContentType 'application/json' -Body $body

- Update a city currency
  $body = @{ currency='USD' } | ConvertTo-Json
  Invoke-RestMethod -Method Put -Uri "http://localhost:3001/cities/<id>" -ContentType 'application/json' -Body $body

Notes
- Data clears when you restart the server. We can add a database later without changing the API.

Tips
- If the port is busy, set a different one: $env:PORT=3101; npm run dev
- Use Node 18 or newer and npm 9 or newer.
