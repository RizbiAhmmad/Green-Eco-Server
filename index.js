const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jwqfj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection


    const database = client.db('GreenEcoDB');
    const usersCollection = database.collection('users');

    // POST endpoint to save user data (with role)
    app.post('/users', async (req, res) => {
      const user = req.body;
      // Add default role as 'user' if not specified
      user.role = user.role || 'user'; // Changed from 'normal user' to 'user'
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'User already exists', insertedId: null });
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
    app.get('/users/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      res.send(user);
    });

    // PUT endpoint to update user role (for admins)
    app.put('/users/:email/role', async (req, res) => {
      const email = req.params.email;
      const { role } = req.body;
      // Validate role
      const validRoles = ['admin', 'volunteer', 'user']; // Changed 'normal user' to 'user'
      if (!validRoles.includes(role)) {
        return res.status(400).send({ message: 'Invalid role' });
      }
      const query = { email: email };
      const updateDoc = { $set: { role: role } };
      const result = await usersCollection.updateOne(query, updateDoc);
      res.send(result);
    });


    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Welcome to you in GreenEco page');
});

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});
