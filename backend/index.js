import app from "./server.js"
import mongodb from "mongodb"
import dotenv from "dotenv"
import RestaurantsDAO from "./dao/restaurantsDAO.js"
import ReviewsDAO from "./dao/reviewsDAO.js"
dotenv.config()
const MongoClient = mongodb.MongoClient

const port = process.env.PORT || 8001

MongoClient.connect(
  process.env.RESTREVIEWS_DB_URI,
  {
    maxPoolSize: 50, // Number of people who can connect at the same time
    wtimeoutMS: 2500, // After 2500 milliseconds, request timeout
    useNewUrlParser: true,
  }
).catch(err => {
  console.error(err.stack)
  process.exit(1)
}).then(async client => {
  // Get initial reference to the restaurants collection
  await RestaurantsDAO.injectDB(client)
  // Get initial reference to the reviews collection
  await ReviewsDAO.injectDB(client)
  app.listen(port, () => {
    console.log(`listening on port ${port}`)
  }) // Start the webserver
})
