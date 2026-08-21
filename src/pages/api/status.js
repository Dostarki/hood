import { connectToDatabase } from '../../lib/mongodb';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  try {
    const { db } = await connectToDatabase();
    
    if (req.method === 'POST') {
      const doc = {
        id: uuidv4(),
        client_name: req.body.client_name,
        timestamp: new Date().toISOString()
      };
      await db.collection('status_checks').insertOne(doc);
      return res.status(200).json(doc);
    } 
    
    if (req.method === 'GET') {
      const checks = await db.collection('status_checks').find({}, { projection: { _id: 0 } }).toArray();
      return res.status(200).json(checks);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
