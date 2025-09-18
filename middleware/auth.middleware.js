import { verifyJwt } from '../utils/index.js'

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res
        .status(400)
        .json({ error: 'Missing or invalid Authorization header' })
    }
    const token = authHeader.split(' ')[1]
    const payload = await verifyJwt(token)

    // console.log(`auth mid payload :`, payload)

    req.user = payload
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}
