const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const port = process.env.PORT || 5000

// middleware
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}))
app.use(express.json())
app.use(cookieParser());



// console.log("password:", process.env.DB_PASS)


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ublbqgg.mongodb.net/?retryWrites=true&w=majority`;

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

        // Collection DB
        const allFoodsCollection = client.db('foodSharingCoDB').collection('allFoods');
        const foodRequestCollection = client.db('foodSharingCoDB').collection('foodRequests');


        const verifyToken = (req, res, next) => {
            const token = req?.cookies?.token;
            console.log({ token });
            if (!token) {
                return res.status(401).send({ message: 'unauthorized access' });
            }

            jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'unauthorized access' });
                }

                req.user = decoded;
                next();
            });
        };


        // GET ALL Foods
        app.get('/api/v1/availableAllfoods', async (req, res) => {
            const cursor = allFoodsCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });
        // GET sorted Featured Foods for homepage
        app.get('/api/v1/AllFeaturedFoods', async (req, res) => {
            const cursor = allFoodsCollection.find().sort({ foodQuantity: -1 }).limit(6);
            const result = await cursor.toArray();
            res.send(result);
        });



        // GET one Food
        app.get('/api/v1/availableFoods/:id', async (req, res) => {
            const id = req.params.id;
            const result = await allFoodsCollection.find({ _id: new ObjectId(id) }).toArray();
            res.send(result);
        });

        // post api for Add food
        app.post('/api/v1/addFood', async (req, res) => {
            const food = req.body;
            const result = await allFoodsCollection.insertOne(food);
            res.send(result);
        })



        // CREATE Food Request
        app.post('/api/v1/user/foodRequests', async (req, res) => {
            const request = req.body;
            const result = await foodRequestCollection.insertOne(request);
            res.send(result);
        });

        // GET SINGLE USER SPECIFIQ REQUEST
        app.get('/api/v1/requests', verifyToken, async (req, res) => {
            const userEmail = req.query.email;

            if (userEmail !== req.user.email) {
                return res
                    .status(403)
                    .send({ message: 'You are not allowed to access !' });
            }
            let query = {}; //get all requests
            if (req.query?.email) {
                query.email = userEmail;
            }

            const result = await foodRequestCollection.find(query).toArray();
            res.send(result);
        });


        // DELETE food Request
        app.delete('/api/v1/user/cancelRequest/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await foodRequestCollection.deleteOne(query);
            res.send(result);
        });



        // JWT Auth Related api
        app.post('/api/v1/auth/access-token', verifyToken, async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' });
            console.log(token);
            res
                .cookie('token', token, {
                    httpOnly: false,
                    secure: true,
                    sameSite: 'none',
                })
                .send({ success: true });
        });



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