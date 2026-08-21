import { connectToDatabase } from '../../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { walletAddress } = req.query;
    const { db } = await connectToDatabase();
    
    const user = await db.collection('users').findOne({ walletAddress });
    res.status(200).json({ ownedBoots: (user && user.ownedBoots) || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
