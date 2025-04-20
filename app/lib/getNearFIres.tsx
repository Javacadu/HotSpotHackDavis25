import clientPromise from "./mongodb"; // Your MongoDB connection utility

async function getNearbyWildfires(lat: number, lng: number, radiusInKm: number) {
  const client = await clientPromise;
  const db = client.db("wildFireHistData"); // Replace with your database name
  const collection = db.collection("wildfires"); // Replace with your collection name

  const wildfires = await collection
    .find({
      coordinates: {
        $near: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: radiusInKm * 1000 // Convert km to meters
        }
      }
    })
    .toArray();

  return wildfires;
}