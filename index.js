const express = require("express");
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const cors = require("cors");
const bcrypt = require('bcryptjs');
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
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
};













async function run() {
  try {

    await client.connect();
    const usersCollection = client.db("aKashDB").collection("users");



    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const email = user?.email;
      const isExist = await usersCollection.findOne({ email: email });
      if (isExist) {
        return res.status(400).send({ msg: 'User already exists' });
      }

      const payload = {
        user: {
          email: email,
          pin: user.pin
        }
      }
      const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d', })
      console.log('token-----', token);
      res
        .cookie('token', token, cookieOptions)
        .send({ success: true })
    })

    app.post('/logout', async (req, res) => {
      const user = null;

      res.clearCookie("token", { ...cookieOptions, maxAge: 0 })
        .send(user);
    })


    app.post('/register', async (req, res) => {
      const userData = req.body;
      console.log(userData);
      const salt = await bcrypt.genSalt(10);
      userData.pin = await bcrypt.hash(userData.pin, salt);
      console.log('salt', salt);
      console.log('pin', userData.pin);
      userData.balance = 0;
      userData.status = 'pending';
      const result = await usersCollection.insertOne(userData);
      res.send(result);
    })


    app.post('/login', async (req, res) => {
      const userData = req.body;
      const email = userData?.email;
      console.log(email);
      const pin = userData?.pin;
      const user = await usersCollection.findOne({ email: email });
      console.log(user);
      if (!user) {
        return res.status(400).send({ msg: 'email not found Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(pin, user?.pin);

      if (!isMatch) {
        return res.status(400).send({ msg: 'not matched Invalid credentials' });
      }


      const userDataForSend = { name: user?.name, mobile: user?.mobile, email: user?.email, role: user?.role, status: user?.status, balance: user?.balance }

      const payload = {
        userData: {
          email: email,
          pin: pin
        }
      }
      const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d', })
      console.log('token-----', token);
      res
        .cookie('token', token, cookieOptions)
        .send(userDataForSend)

    })


    app.get('/user', verifyToken, async (req, res) => {
      const user = await usersCollection.findOne({ email: req?.user?.email });
      res.send(user);

    });







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