import type { NextFunction, Request, Response } from 'express'

export function notFound(req: Request, res: Response) {
  res.status(404).json({ error: 'Not Found', path: req.path })
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const message = err instanceof Error ? err.message : 'Internal Server Error'
  const status = res.statusCode && res.statusCode >= 400 ? res.statusCode : 500
  res.status(status).json({ error: message })
}
