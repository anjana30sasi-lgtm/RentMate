require('dotenv').config();
const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');

const memberId = (member) => (member._id || member).toString();

async function repairLegacySettlements() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required.');
  const sourceExpenseId = process.argv[2];
  if (!sourceExpenseId) throw new Error('Provide the affected expense ID as the first argument.');
  await mongoose.connect(process.env.MONGODB_URI);
  const invalidSettlement = await Settlement.exists({ sourceExpense: sourceExpenseId, $expr: { $eq: ['$from', '$to'] } });
  if (!invalidSettlement) throw new Error('This expense has no invalid self-settlement to repair.');
  const expense = await Expense.findById(sourceExpenseId);
  if (!expense) throw new Error('Expense not found.');
  const payer = expense.paidBy.toString();
  const participants = [...new Set(expense.splitBetween.map(memberId))];
  const share = expense.amount / participants.length;
  const settlements = participants.filter((participant) => participant !== payer).map((participant) => ({ house: expense.house, from: participant, to: payer, amount: share, status: 'Pending', sourceExpense: expense._id }));
  await Settlement.deleteMany({ sourceExpense: expense._id });
  if (settlements.length) await Settlement.insertMany(settlements);
  console.log(`Rebuilt settlements for expense ${expense._id}.`);
  await mongoose.disconnect();
}

repairLegacySettlements().catch(async (error) => { console.error(error.message); await mongoose.disconnect(); process.exit(1); });
