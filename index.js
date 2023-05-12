const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
dotenv.config();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("car doctor server running");
});

// mongodb connection................

const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.13ytubh.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("successfully connected to MongoDB!");
    const db = client.db("car-doctor");
    const serviceCollection = db.collection("services");
    const bookingCollection = db.collection("services");

    app.get("/services", async (req, res) => {
      const reslut = await serviceCollection.find().toArray();
      res.send(reslut);

      app.get("/services/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const option = {
          title: 1,
          price: 1,
          service_id: 1,
          img: 1,
        };
        const reslut = await serviceCollection.findOne(query, option);
        res.send(reslut);
      });
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`car doctor server running ${port}`);
});
