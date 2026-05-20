const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const express = require('express');
const dotenv=require("dotenv");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors=require('cors');
dotenv.config();
const app = express();
app.use(cors())
const port = process.env.PORT || 8080;


const uri = "mongodb+srv://docappoint:E54v5C053Pg5WvhU@cluster0.2nmczrj.mongodb.net/?appName=Cluster0";

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
   
    await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });

    const db=client.db('docappointdb');
    const doctorCollection=db.collection("doctors");

    app.get("/doctors",async(req,res)=>{
        const cursor=doctorCollection.find();
        const result=await cursor.toArray();
        // console.log(result);
        res.send(result);
    });

    app.get("/doctors/:doctorId",async(req,res)=>{
    //    const doctorId=req.params.doctorId;
        const {doctorId}=req.params;
        // console.log(doctorId);
        const query={_id:new ObjectId(doctorId)}
        const result=await doctorCollection.findOne(query);
        res.send(result);
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