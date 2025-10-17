import { z } from 'zod'

export const citySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  country_code: z.string().length(2),
  currency: z.string().length(3)
})

export const seasonSchema = z.object({
  id: z.string().uuid().optional(),
  city_id: z.string().uuid(),
  season_name: z.enum(['peak', 'shoulder', 'off']),
  start_month: z.number().int().min(1).max(12),
  end_month: z.number().int().min(1).max(12)
})

export type CityInput = z.infer<typeof citySchema>
export type SeasonInput = z.infer<typeof seasonSchema>
