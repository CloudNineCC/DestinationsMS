export type City = {
  id: string
  name: string
  country_code: string
  currency: string
}

export type Season = {
  id: string
  city_id: string
  season_name: 'peak' | 'shoulder' | 'off'
  start_month: number
  end_month: number
}
