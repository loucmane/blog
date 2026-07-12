import express from 'express'
import { getFeatures, getFeatureById } from '../controllers/featureController.js'

const router = express.Router()

// Feature routes
router.get('/features', getFeatures)
router.get('/features/:id', getFeatureById)

// Example protected route
router.get('/protected', (req, res) => {
  // TODO: Add authentication middleware
  res.json({ message: 'This is a protected route' })
})

export default router
