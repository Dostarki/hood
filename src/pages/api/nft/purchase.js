import { connectToDatabase } from '../../../lib/mongodb';
import { v4 as uuidv4 } from 'uuid';

const NFT_TREASURY = '0x603a26e0745aE579ad0F931307a386ddC3DD096F';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { walletAddress, bootId, txHash, priceUsd } = req.body;
    if (!walletAddress || !bootId || !txHash) {
      return res.status(400).json({ error: 'Missing data' });
    }
    
    const { db } = await connectToDatabase();

    await db.collection('users').updateOne(
      { walletAddress },
      {
        $addToSet: { ownedBoots: bootId },
        $setOnInsert: { walletAddress, totalGoals: 0, createdAt: new Date() }
      },
      { upsert: true }
    );

    await db.collection('nft_purchases').insertOne({
      id: uuidv4(),
      walletAddress,
      bootId,
      txHash,
      priceUsd: Number(priceUsd) || 0,
      treasury: NFT_TREASURY,
      createdAt: new Date()
    });

    const user = await db.collection('users').findOne({ walletAddress });
    res.status(200).json({ success: true, ownedBoots: (user && user.ownedBoots) || [bootId] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
