import express from "express"
import cors from "cors"
import restaurants from "./api/restaurants.route.js"

const app = express()

app.use(cors())
// Server accepts JSON in the body of a request
app.use(express.json())

app.use("/api/v1/restaurants", restaurants)

// Any route not in our route file
app.use("*", (req, res) => res.status(404).json({ error: "not found"}))

// Exports the app as a module
export default app
