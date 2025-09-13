import { configDotenv } from 'dotenv'
import app from './app.js'

// load environment variables
configDotenv()

const PORT = process.env.PORT || 5000

//consider bootstrapping other services here (DB)

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} (${process.env.NODE_ENV})`)
})
