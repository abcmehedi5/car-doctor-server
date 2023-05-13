const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
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

// verify jwt token
const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorized access" });
  }

  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("successfully connected to MongoDB!");
    const db = client.db("car-doctor");
    const serviceCollection = db.collection("services");
    const bookingCollection = db.collection("booking");

    // jwt token .................
    app.post("/jwt", (req, res) => {
      const user = req.body;
      console.log(req.body);
      const token = jwt.sign(user, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
      console.log(token);
      res.send({ token });
    });

    // service routes............

    app.get("/services", async (req, res) => {
      const reslut = await serviceCollection.find().toArray();
      res.send(reslut);
    });

    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const option = {
        projection: { title: 1, price: 1, service_id: 1, img: 1 },
      };
      const reslut = await serviceCollection.findOne(query, option);
      res.send(reslut);
    });

    // booking submited
    app.post("/booking", async (req, res) => {
      const data = req.body;
      const result = await bookingCollection.insertOne(data);
      res.send(result);
    });

    app.get("/bookingAll", async (req, res) => {
      const result = await bookingCollection.find().toArray();
      res.send(result);
    });

    app.get("/booking", verifyJWT, async (req, res) => {
      const email = req.query.email;

      // extra secure   
      const decoded = req.decoded;
      if (email !== decoded.email) {
        return res
          .status(403)
          .send({ error: true, message: "forbidden access" });
      }
      
      const result = await bookingCollection.find({ email: email }).toArray();
      res.send(result);
    });

    app.delete("/booking/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.deleteOne(query);
      console.log(id);
      res.send(result);
    });

    app.patch("/orderStatus/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body.status;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.updateOne(query, {
        $set: { status: data },
      });
      res.send(result);
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
