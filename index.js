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
    origin: [
        // 'http://localhost:5173',
        'https://food-sharing-community.web.app',
        'https://food-sharing-community.firebaseapp.com'
    ],

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
        // await client.connect();

        // Collection DB
        const allFoodsCollection = client.db('foodSharingCoDB').collection('allFoods');
        const foodRequestCollection = client.db('foodSharingCoDB').collection('foodRequests');



        // middleware For verify token
        const logger = (req, res, next) => {
            console.log('log: info', req.method, req.url);
            next()
        }
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
            // Load specifiq User data
            console.log(req.query.donatorEmail)
            // console.log('Token owner information', req.user)
            // if(req.user.email != req.query.donatorEmail){
            //     return res.status(403).send({message: 'Forbidden access'})
            // }

            let query = {}
            if (req.query?.donatorEmail) {
                query = { donatorEmail: req.query.donatorEmail }
            }

            const cursor = allFoodsCollection.find(query);
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
            const result = await allFoodsCollection.findOne({ _id: new ObjectId(id) });
            res.send(result);
        });
        // Delete one Food
        app.delete('/api/v1/availableAllfoods/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await allFoodsCollection.deleteOne(query);
            res.send(result);
        })

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

        // GET ALL Foods requests
        app.get('/api/v1/user/foodRequests', logger, verifyToken, async (req, res) => {
            // Load specifiq User data
            console.log(req.query.requesterEmail)
            console.log('Token owner information', req.user)
            if (req.user.email != req.query.requesterEmail) {
                return res.status(403).send({ message: 'Forbidden access' })
            }
            let query = {}
            if (req.query?.requesterEmail) {
                query = { requesterEmail: req.query.requesterEmail }
            }

            const cursor = foodRequestCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });


        // get one food from all requests
        app.get('/api/v1/user/foodRequests/:id', async (req, res) => {
            const id = req.params.id;
            const result = await foodRequestCollection.findOne({ _id: new ObjectId(id) });
            res.send(result);
        });

        // DELETE food Request
        app.delete('/api/v1/user/foodRequests/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await foodRequestCollection.deleteOne(query);
            res.send(result);
        });



        // Update food 
        app.put('/api/v1/availableFoods/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedFood = req.body;
            const newUpdatedFood = {
                $set: {
                    foodName: updatedFood.foodName,
                    foodImage: updatedFood.foodImage,
                    donatorImage: updatedFood.donatorImage,
                    donatorName: updatedFood.donatorName,
                    foodQuantity: updatedFood.foodQuantity,
                    pickupLocation: updatedFood.pickupLocation,
                    expireDate: updatedFood.expireDate,
                    foodStatus: updatedFood.foodStatus,
                    donatorEmail: updatedFood.donatorEmail
                }
            }
            const result = await allFoodsCollection.updateOne(filter, newUpdatedFood, options)
            res.send(result)
        })




        // JWT Auth Related api
        app.post('/api/v1/auth/access-token', async (req, res) => {
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

        app.post('/api/v1/auth/logout', async (req, res) => {
            const user = req.body;
            console.log('log out the user', user);
            res.clearCookie('token', { maxAge: 0 }).send({ success: true })
        })



        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
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