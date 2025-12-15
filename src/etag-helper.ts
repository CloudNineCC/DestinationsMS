import crypto from 'crypto'

export function generateETag(data: any): string {
  const hash = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex')
  return `"${hash}"`
}

export function checkETag(req: any, etag: string): boolean {
  const ifNoneMatch = req.headers['if-none-match']
  return ifNoneMatch === etag
}