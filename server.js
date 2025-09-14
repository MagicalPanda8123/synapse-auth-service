import app from './app.js'

const PORT = process.env.PORT || 5000

//consider bootstrapping other services here (DB)

app.listen(PORT, () => {
  console.log(
    `🔐 Auth service running on port ${PORT} (${process.env.NODE_ENV})`
  )
})
