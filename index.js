const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express')
const app = express()
const cors = require('cors');
const port = process.env.PORT || 5000

// middleware
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}))
app.use(express.json())

//   food-sharing-community
// BiuFgq040jT9U6Q2



const uri = "mongodb+srv://food-sharing-community:BiuFgq040jT9U6Q2@cluster0.ublbqgg.mongodb.net/?retryWrites=true&w=majority";

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
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Food Sharing Community Server is Running')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})