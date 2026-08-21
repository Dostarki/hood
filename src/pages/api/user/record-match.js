import { connectToDatabase } from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { walletAddress, goalsScored } = req.body;
    if (!walletAddress || typeof goalsScored !== 'number') {
      return res.status(400).json({ error: 'Missing data' });
    }
    
    const { db } = await connectToDatabase();

    await db.collection('users').updateOne(
      { walletAddress },
      { $inc: { totalGoals: goalsScored } }
    );
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
