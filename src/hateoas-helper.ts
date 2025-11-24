export function addCityLinks(city: any, baseUrl: string) {
  return {
    ...city,
    _links: {
      self: { href: `${baseUrl}/cities/${city.id}` },
      seasons: { href: `${baseUrl}/cities/${city.id}/seasons` },
      update: { href: `${baseUrl}/cities/${city.id}`, method: 'PUT' },
      delete: { href: `${baseUrl}/cities/${city.id}`, method: 'DELETE' },
    }
  }
}

export function addSeasonLinks(season: any, baseUrl: string) {
  return {
    ...season,
    _links: {
      self: { href: `${baseUrl}/seasons/${season.id}` },
      city: { href: `${baseUrl}/cities/${season.city_id}` },
      update: { href: `${baseUrl}/seasons/${season.id}`, method: 'PUT' },
      delete: { href: `${baseUrl}/seasons/${season.id}`, method: 'DELETE' },
    }
  }
}

export function addPaginationLinks(baseUrl: string, path: string, page: number, limit: number, total: number) {
  const totalPages = Math.ceil(total / limit)
  const links: any = {
    self: { href: `${baseUrl}${path}?page=${page}&limit=${limit}` },
  }

  if (page > 1) {
    links.first = { href: `${baseUrl}${path}?page=1&limit=${limit}` }
    links.prev = { href: `${baseUrl}${path}?page=${page - 1}&limit=${limit}` }
  }

  if (page < totalPages) {
    links.next = { href: `${baseUrl}${path}?page=${page + 1}&limit=${limit}` }
    links.last = { href: `${baseUrl}${path}?page=${totalPages}&limit=${limit}` }
  }

  return links
}