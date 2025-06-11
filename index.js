const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jwqfj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

    const database = client.db("GreenEcoDB");
    const usersCollection = database.collection("users");
    const eventsCollection = database.collection("events");

    // POST endpoint to save user data (with role)
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "User already exists", insertedId: null });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      // console.log(req.headers);
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    // GET endpoint to retrieve user data (including role)
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      res.send(user);
    });

    // PUT endpoint to update user role (for admins)
    app.put("/users/:email/role", async (req, res) => {
      const email = req.params.email;
      const { role } = req.body;
      // Validate role
      const validRoles = ["admin", "volunteer", "user"]; // Changed 'normal user' to 'user'
      if (!validRoles.includes(role)) {
        return res.status(400).send({ message: "Invalid role" });
      }
      const query = { email: email };
      const updateDoc = { $set: { role: role } };
      const result = await usersCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // PATCH endpoint to make a user an admin by ID
    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateDoc = { $set: { role: "admin" } };
      const result = await usersCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // DELETE endpoint to remove a user
    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    app.post("/events", async (req, res) => {
      const event = req.body;

      if (!event.email || !event.role) {
        return res
          .status(400)
          .send({ message: "User email and role are required" });
      }

      const result = await eventsCollection.insertOne(event);
      res.send(result);
    });

    // GET endpoint to fetch all events
    app.get("/events", async (req, res) => {
      try {
        const events = await eventsCollection.find().toArray();
        res.send(events);
      } catch (error) {
        res.status(500).send({ message: "Failed to fetch events", error });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Welcome to you in GreenEco page");
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
