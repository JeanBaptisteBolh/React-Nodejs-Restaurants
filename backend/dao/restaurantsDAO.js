import mongodb from "mongodb"
const ObjectId = mongodb.ObjectID

let restaurants

export default class RestaurantsDAO {
  // This is how we initially connect to our db
  static async injectDB(conn) {
    // If reference already exists, return
    if (restaurants) {
      return
    }
    // Otherwise connect
    try {
      restaurants = await conn.db(process.env.RESTREVIEWS_NS).collection("restaurants")
    } catch (e) {
      console.error(
        `Unable to establish a collection handle in restaurantsDAO: ${e}`,
      )
    }
  }

  static async getRestaurants({
    filters = null, // filters based on name, zip code, cuisine etc...
    page = 0,
    restaurantsPerPage = 20,
  } = {}) {
    let query
    if (filters) {
      // This does a text search, text must contain
      if ("name" in filters) {
        query = { $text: { $search: filters["name"] } }
      // Check for cuisine/zipcode equality
      } else if ("cuisine" in filters) {
        query = { "cuisine": { $eq: filters["cuisine"] } }
      } else if ("zipcode" in filters) {
        query = { "address.zipcode": { $eq: filters["zipcode"] } }
      }
    }

    let cursor

    try {
      cursor = await restaurants.find(query)
    } catch (e) {
      console.log(`Unable to issue find command, ${e}`)
      return { restaurantsList: [], totalNumRestaurants: 0 }
    }

    // Limit the results and skip to page.
    const displayCursor = cursor.limit(restaurantsPerPage).skip(restaurantsPerPage * page)

    try {
      const restaurantsList = await displayCursor.toArray()
      const totalNumRestaurants = await restaurants.countDocuments(query)

      return { restaurantsList, totalNumRestaurants }
    } catch (e) {
      console.error(
        `Unable to convert cursor to array or probelm counting documents: ${e}`
      )
      return { restaurantsList: [], totalNumRestaurants: 0 }
    }
  }

  static async getRestaurantByID(id) {
    try {
      // Helps match different collections together
      const pipeline = [
        {
          $match: {
            _id: new ObjectId(id)
          },
        },
        {
          // mongodb aggregation pipeline
          // Match all reviews that match the restaurant id
          $lookup: {
            from: "reviews",
            let: {
              id: "$_id",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$restaurant_id", "$$id"],
                  },
                },
              },
              {
                $sort: {
                  date: -1,
                },
              },
            ],
            as: "reviews",
          },
        },
        {
          $addFields: {
            reviews: "$reviews",
          },
        },
      ]
      return await restaurants.aggregate(pipeline).next()
    } catch (e) {
      console.error(`Somthing went wrong in getRestaurantByID: ${e}`)
      throw e
    }
  }

  static async getCuisines() {
    let cuisines = []
    try {
      // Get each cuisine one time
      cuisines = await restaurants.distinct("cuisine")
      return cuisines
    } catch (e) {
      console.error(`Unable to get cuisines, ${e}`)
      return cuisines
    }
  }

}
