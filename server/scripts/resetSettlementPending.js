require('dotenv').config();
const mongoose = require('mongoose');
const Settlement = require('../models/Settlement');

async function resetSettlementPending() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required.');
  const settlementId = process.argv[2];
  if (!settlementId) throw new Error('Provide the settlement ID as the first argument.');
  await mongoose.connect(process.env.MONGODB_URI);
  const settlement = await Settlement.findById(settlementId);
  if (!settlement) throw new Error('Settlement not found.');
  if (settlement.from.toString() === settlement.to.toString()) throw new Error('A self-settlement cannot be reset.');
  settlement.status = 'Pending';
  await settlement.save();
  console.log(`Settlement ${settlement._id} is now Pending.`);
  await mongoose.disconnect();
}

resetSettlementPending().catch(async (error) => { console.error(error.message); await mongoose.disconnect(); process.exit(1); });
