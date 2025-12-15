import type { City, Season } from './types.js'

export function generateOpenAPISpec() {
  return {
    openapi: '3.0.3',
    info: {
      title: 'Destinations API',
      version: '0.1.0',
      description: 'API for managing destination cities and seasons'
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3001',
        description: 'Destinations Microservice'
      }
    ],
    paths: {
      '/cities': {
        get: {
          summary: 'List cities',
          description: 'Get a paginated list of cities with optional filtering',
          parameters: [
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', minimum: 1, default: 1 }
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
            },
            {
              name: 'country_code',
              in: 'query',
              schema: { type: 'string', length: 2 }
            },
            {
              name: 'currency',
              in: 'query',
              schema: { type: 'string', length: 3 }
            },
            {
              name: 'search',
              in: 'query',
              schema: { type: 'string' }
            }
          ],
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/City' }
                      },
                      pagination: { $ref: '#/components/schemas/Pagination' },
                      _links: { $ref: '#/components/schemas/Links' }
                    }
                  }
                }
              }
            }
          }
        },
        post: {
          summary: 'Create a city',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CityInput' }
              }
            }
          },
          responses: {
            '201': {
              description: 'City created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/City' }
                }
              }
            },
            '400': {
              description: 'Validation error'
            }
          }
        }
      },
      '/cities/{id}': {
        get: {
          summary: 'Get a city by ID',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' }
            }
          ],
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/City' }
                }
              }
            },
            '404': {
              description: 'City not found'
            }
          }
        },
        put: {
          summary: 'Update a city',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' }
            },
            {
              name: 'If-Match',
              in: 'header',
              schema: { type: 'string' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CityInput' }
              }
            }
          },
          responses: {
            '200': {
              description: 'City updated',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/City' }
                }
              }
            },
            '404': {
              description: 'City not found'
            },
            '412': {
              description: 'Precondition Failed'
            }
          }
        },
        delete: {
          summary: 'Delete a city',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' }
            }
          ],
          responses: {
            '204': {
              description: 'City deleted'
            },
            '404': {
              description: 'City not found'
            }
          }
        }
      },
      '/cities/batch': {
        post: {
          summary: 'Batch import cities',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    cities: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/CityInput' }
                    }
                  }
                }
              }
            }
          },
          responses: {
            '202': {
              description: 'Batch import accepted',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      job_id: { type: 'string' },
                      status: { type: 'string' },
                      _links: { $ref: '#/components/schemas/Links' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/seasons': {
        get: {
          summary: 'List seasons',
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Season' }
                  }
                }
              }
            }
          }
        },
        post: {
          summary: 'Create a season',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SeasonInput' }
              }
            }
          },
          responses: {
            '201': {
              description: 'Season created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Season' }
                }
              }
            }
          }
        }
      },
      '/seasons/{id}': {
        get: {
          summary: 'Get a season by ID',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' }
            }
          ],
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Season' }
                }
              }
            }
          }
        },
        put: {
          summary: 'Update a season',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SeasonInput' }
              }
            }
          },
          responses: {
            '200': {
              description: 'Season updated'
            }
          }
        },
        delete: {
          summary: 'Delete a season',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' }
            }
          ],
          responses: {
            '204': {
              description: 'Season deleted'
            }
          }
        }
      },
      '/jobs/{id}': {
        get: {
          summary: 'Get job status',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' }
            }
          ],
          responses: {
            '200': {
              description: 'Job status',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Job' }
                }
              }
            }
          }
        }
      }
    },
    components: {
      schemas: {
        City: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            country_code: { type: 'string', length: 2 },
            currency: { type: 'string', length: 3 },
            _links: { $ref: '#/components/schemas/Links' }
          },
          required: ['id', 'name', 'country_code', 'currency']
        },
        CityInput: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', minLength: 1 },
            country_code: { type: 'string', length: 2 },
            currency: { type: 'string', length: 3 }
          },
          required: ['name', 'country_code', 'currency']
        },
        Season: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            city_id: { type: 'string', format: 'uuid' },
            season_name: {
              type: 'string',
              enum: ['peak', 'shoulder', 'off']
            },
            start_month: { type: 'integer', minimum: 1, maximum: 12 },
            end_month: { type: 'integer', minimum: 1, maximum: 12 },
            _links: { $ref: '#/components/schemas/Links' }
          },
          required: ['id', 'city_id', 'season_name', 'start_month', 'end_month']
        },
        SeasonInput: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            city_id: { type: 'string', format: 'uuid' },
            season_name: {
              type: 'string',
              enum: ['peak', 'shoulder', 'off']
            },
            start_month: { type: 'integer', minimum: 1, maximum: 12 },
            end_month: { type: 'integer', minimum: 1, maximum: 12 }
          },
          required: ['city_id', 'season_name', 'start_month', 'end_month']
        },
        Job: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            type: { type: 'string' },
            status: {
              type: 'string',
              enum: ['pending', 'processing', 'completed', 'failed']
            },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            result: { type: 'object' },
            error: { type: 'string' },
            _links: { $ref: '#/components/schemas/Links' }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            total_pages: { type: 'integer' }
          }
        },
        Links: {
          type: 'object',
          properties: {
            self: { $ref: '#/components/schemas/Link' },
            first: { $ref: '#/components/schemas/Link' },
            prev: { $ref: '#/components/schemas/Link' },
            next: { $ref: '#/components/schemas/Link' },
            last: { $ref: '#/components/schemas/Link' },
            job_status: { $ref: '#/components/schemas/Link' }
          }
        },
        Link: {
          type: 'object',
          properties: {
            href: { type: 'string' },
            method: { type: 'string' }
          }
        }
      }
    }
  }
}

