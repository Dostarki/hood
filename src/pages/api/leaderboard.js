import { connectToDatabase } from '../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { db } = await connectToDatabase();
    const topUsers = await db.collection('users')
      .find({ nickname: { $exists: true, $ne: '' } })
      .sort({ totalGoals: -1 })
      .limit(10)
      .toArray();
      
    res.status(200).json(topUsers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
