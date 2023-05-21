const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const cors = require('cors')
const port = process.env.PORT || 5000
require('dotenv').config()

const app = express()
// middleware
app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASSWORD}@cluster0.c8viahs.mongodb.net/?retryWrites=true&w=majority`;

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
        const database = client.db("toyMarketplaceDB");
        const toyCollection = database.collection("toys");

        app.get('/', (req, res) => {
            res.send('Toy MerkatPlace Website Server is Running...')
        })

        app.get('/toyByCetagory', async (req, res) => {
            const cetagoryName = req.query.name
            const query = { subCategory: cetagoryName }
            const cursor = toyCollection.find(query)
            const result = (await cursor.toArray()).slice(0, 3)
            res.send(result)
        })

        app.get('/allToys', async (req, res) => {
            const limit = parseInt(req.query.limit)
            const search = req.query.search
            const query = {}; // Empty query object
            if (search) {
                // If search query is provided, add a filter to the query object
                query.toyName = { $regex: search, $options: 'i' };
                // Using $regex with 'i' option for case-insensitive search
            }
            const cursor = toyCollection.find(query)
            const result = await cursor.toArray()
            const limitedData = result.slice(0, limit)
            res.send(limitedData)
        })

        app.get('/toy/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const cursor = toyCollection.find(filter)
            const result = await cursor.toArray()
            res.send(result)
        })

        app.get('/myToys/:email', async (req, res) => {
            const sortBy = parseInt(req.query.sortBy)
            const email = req.params.email
            const filter = { sellerEmail: email }
            const cursor = toyCollection.find(filter).sort({ "price": sortBy })
            const result = await cursor.toArray()
            res.send(result)
        })

        app.post('/addToy', async (req, res) => {
            const data = req.body
            const result = await toyCollection.insertOne(data)
            res.send(result)
        })

        app.patch('/myToyUpdate/:id', async (req, res) => {
            const data = req.body
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true }

            const updateDoc = {
                $set: {
                    ...data
                },
            };

            const result = await toyCollection.updateOne(filter, updateDoc, options);
            res.send(result)
        })

        app.delete('/mytoys/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await toyCollection.deleteOne(query)
            res.send(result)
        })

        // Connect the client to the server	(optional starting in v4.7)
        client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.listen(port, () => {
    console.log('connect on port:', port);
})