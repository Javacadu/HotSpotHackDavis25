const mongoose = require('mongoose');
const uri = "mongodb+srv://javacadu:scrRw8WFpSV1TFOz@hotspotdb.vcauaim.mongodb.net/?retryWrites=true&w=majority&appName=hotSpotDB";

const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

async function run() {
  try {
    console.log("Attempting to connect to MongoDB...");
    // Create a Mongoose client with a MongoClientOptions object to set the Stable API version
    await mongoose.connect(uri, clientOptions);
    console.log("Connected to MongoDB!");

    // Ping the database
    const pingResult = await mongoose.connection.db.admin().command({ ping: 1 });
    console.log("Ping result:", pingResult);
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  } finally {
    // Ensures that the client will close when you finish/error
    console.log("Disconnecting from MongoDB...");
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}
run().catch(console.dir);
