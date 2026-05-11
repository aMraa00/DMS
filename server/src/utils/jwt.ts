import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { env } from '../config/env.js'
import type { Role } from '../types/roles.js'

export interface AccessPayload {
  sub: string
  role: Role
  type: 'access'
}

export interface RefreshPayload {
  sub: string
  role: Role
  type: 'refresh'
  jti: string
}

export function signAccessToken(userId: string, role: Role) {
  const payload: AccessPayload = { sub: userId, role, type: 'access' }
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES as jwt.SignOptions['expiresIn'],
  })
}

export function signRefreshToken(userId: string, role: Role) {
  const jti = uuidv4()
  const payload: RefreshPayload = { sub: userId, role, type: 'refresh', jti }
  const token = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES as jwt.SignOptions['expiresIn'],
  })
  return { token, jti }
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshPayload
}
