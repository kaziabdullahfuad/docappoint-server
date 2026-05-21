const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const express = require('express');
const dotenv=require("dotenv");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors=require('cors');
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
dotenv.config();
const app = express();

const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;

const JWKS = createRemoteJWKSet(new URL(`${process.env.CLIENT_URL}/api/auth/jwks`));

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const logger = (req, res, next) => {
  console.log(`${req.method} | ${req.url}`);
  next();
};

const verifyToken = async (req, res, next) => {
  const { authorization } = req.headers;
  //   console.log(req.headers, 'from verify token');
  const token = authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorize' });
  }

  try {
    const JWKS = createRemoteJWKSet(new URL('http://localhost:3000/api/auth/jwks'));
    const { payload } = await jwtVerify(token, JWKS);
    req.user = payload;

    next();
  } catch (error) {
    console.error('Token validation failed:', error);
    return res.status(401).json({ message: 'Unauthorize' });
  }

};

async function run() {
  try {
   
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });

    const db=client.db('docappointdb');
    const doctorCollection=db.collection("doctors");
    const appointmentCollection=db.collection("appointments");

    app.get("/doctors",async(req,res)=>{
        const cursor=doctorCollection.find();
        const result=await cursor.toArray();
        // console.log(result);
        res.send(result);
    });

    app.get("/doctors/:doctorId",logger,verifyToken,async(req,res)=>{
    //    const doctorId=req.params.doctorId;
        const {doctorId}=req.params;
        // console.log(doctorId);
        const query={_id:new ObjectId(doctorId)}
        const result=await doctorCollection.findOne(query);
        res.send(result);
    });

    //appoint part shuru
    app.post("/appointments",verifyToken,async(req,res)=>{
        const appointmentData=req.body;
         const result = await appointmentCollection.insertOne(appointmentData);

        res.json(result);
    })

    // appointment getting
    app.get("/appointments/:userId",verifyToken, async (req, res) => {
        const { userId } = req.params;

        const result = await appointmentCollection
          .find({ userId: userId })
          .toArray();

        res.json(result);
    });

    // appointment delete
    app.delete("/appointments/:id", verifyToken, async (req, res) => {
        const { id } = req.params;

        const result = await appointmentCollection.deleteOne({
          _id: new ObjectId(id),
        });

        res.json(result);
    });

    // appointment patch
    app.patch("/appointments/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  const updatedData = req.body;

        const result = await appointmentCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: updatedData,
          }
        );

        res.json(result);
    });


    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})