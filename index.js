const express = require("express");
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser())
const port = process.env.PORT || 5000;







const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.iulixph.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});




const logger = (req, res, next) => {
  console.log('log infooooooooo', req.method, req.url);
  next();

}

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  console.log('token:', token);

  if (!token) {
    return res.status(401).send({ message: 'Unauthorized access1' })
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'Unauthorized access2' })
    }
    req.user = decoded
    next();
  })
}





const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production" ? true : false,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};
async function run() {
  try {

    await client.connect();
    const usersCollection = client.db("aKashDB").collection("users");



    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '365d', })
      res
        .cookie('token', token, cookieOptions)
        .send({ success: true })
    })

    app.post('/logout', async (req, res) => {
      const user = req.user;

      res.clearCookie("token", { ...cookieOptions, maxAge: 0 })
        .send({ success: true });
    })


    // verify admin here

    // const verifyAdmin = async (req, res, next) => {
    //   const email = req.user.email;
    //   const query = { email: email }
    //   const user = await usersCollection.findOne(query);
    //   const isAdmin = user?.role === "admin";
    //   if (!isAdmin) {
    //     return res.status(403).send({ message: 'forbidden access' })
    //   }
    //   next();
    // }









    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error

  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('aKash server is running')
})

app.listen(port, () => {
  console.log(`aKash server is running on port${port}`);
})