import { connectToDatabase } from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { walletAddress, nickname } = req.body;
    if (!walletAddress || !nickname) return res.status(400).json({ error: 'Missing data' });
    
    const { db } = await connectToDatabase();
    
    const existingUser = await db.collection('users').findOne({ walletAddress });
    if (existingUser) {
      if (!existingUser.nickname) {
        await db.collection('users').updateOne({ walletAddress }, { $set: { nickname } });
        return res.status(200).json({ success: true, message: 'Nickname updated' });
      }
      return res.status(200).json({ success: false, message: 'User already registered' });
    }

    const newUser = {
      walletAddress,
      nickname,
      totalGoals: 0,
      createdAt: new Date()
    };
    await db.collection('users').insertOne(newUser);
    res.status(200).json({ success: true, user: newUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
