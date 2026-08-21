import { connectToDatabase } from '../../../lib/mongodb';
import { v4 as uuidv4 } from 'uuid';

const NFT_TREASURY = '0x603a26e0745aE579ad0F931307a386ddC3DD096F';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { walletAddress, stakeUsd, txHash } = req.body;
    if (!walletAddress || !txHash) {
      return res.status(400).json({ error: 'Missing data' });
    }
    
    const { db } = await connectToDatabase();

    await db.collection('ranked_stakes').insertOne({
      id: uuidv4(),
      walletAddress,
      stakeUsd: Number(stakeUsd) || 0,
      txHash,
      treasury: NFT_TREASURY,
      createdAt: new Date()
    });
    
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
