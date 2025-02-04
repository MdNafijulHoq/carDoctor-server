const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const app = express()
require('dotenv').config()
const port = process.env.PORT || 5000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

//middleware
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true,
}))
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.33r9n.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

    const database = client.db("carDoctor");
    const servicesCollection = database.collection("services");
    const bookingCollection = database.collection("booking");


    // ? Auth related API/JWT
    app.post('/jwt', async(req, res) => {
      const user = req.body;
      console.log(user)
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
      res
      .cookie('token', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'none'
      })
      .send({success: true})
    })

    // TODO services related API
    app.get('/services', async(req, res) => {
      const cursor = servicesCollection.find();
      const result = await cursor.toArray();
      res.send(result)
    })

    app.get('/services/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await servicesCollection.findOne(query)
      res.send(result)
    })

    // receiving booking form data
    app.post('/booking', async(req, res) => {
      const booking = req.body;
      console.log(booking)
      const result = await bookingCollection.insertOne(booking);
      res.send(result)
    })

    // * showing all booking also showing email/user specific info/data
    app.get('/booking', async(req, res) => {
      console.log(req.query.email)
      let query = {};
      if(req.query?.email){
        query = {email: req.query.email}
      }
      const cursor = bookingCollection.find(query);
      const result = await cursor.toArray();
      res.send(result)
    })

    app.patch('/booking/:id', async(req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const updateBooking = req.body;
      console.log(updateBooking)
      const updatedDoc = {
        $set: {
          status: updateBooking.status
        },
      }
      const result = await bookingCollection.updateOne(filter, updatedDoc)
      res.send(result)
    })

    app.delete('/booking/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await bookingCollection.deleteOne(query)
      res.send(result)
    })




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
  res.send('car doctor is running')
})

app.listen(port, () => {
  console.log(`car doctor is running on port: ${port}`)
})