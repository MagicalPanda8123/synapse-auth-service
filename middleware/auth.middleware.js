import { verifyJwt } from '../utils/index.js'

export async function authMiddleware(req, res, next) {
  try {
    // Try to get token from Authorization header
    let token = null
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1]
    }

    // If not found, try to get token from cookie
    if (!token && req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken
    }

    if (!token) {
      return res.status(400).json({ error: 'Missing access token' })
    }

    const payload = await verifyJwt(token)
    req.user = payload
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export async function adminAuthMiddleware(req, res, next) {
  try {
    // Ensure the user is authenticated and their role is SYSTEM_ADMIN
    if (!req.user || req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Admins only cuh </3' })
    }
    next()
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' })
  }
}
