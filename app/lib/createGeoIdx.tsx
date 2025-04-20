import { MongoClient } from 'mongodb';

/**
 * Creates a geospatial index on the coordinates field in the wildfires collection
 */
export async function createWildfiresGeospatialIndex() {
    try {
        // Replace with your MongoDB connection string
        const uri = process.env.MONGODB_URI || '';
        const client = new MongoClient(uri);
        
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db(); // Use default database name or specify one
        
        // Create the 2dsphere index on the coordinates field
        await db.collection('wildfires').createIndex({ "coordinates": "2dsphere" });
        console.log('Created 2dsphere index on wildfires.coordinates');
        
        await client.close();
        return { success: true, message: 'Geospatial index created successfully' };
    } catch (error) {
        console.error('Error creating geospatial index:', error);
        return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
}