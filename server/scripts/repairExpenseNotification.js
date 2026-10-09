require('dotenv').config();
const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const Notification = require('../models/Notification');
const User = require('../models/User');

async function repairExpenseNotification() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required.');
  const [notificationId, expenseId] = process.argv.slice(2);
  if (!notificationId || !expenseId) throw new Error('Provide notification ID and related expense ID.');
  await mongoose.connect(process.env.MONGODB_URI);
  const [notification, expense] = await Promise.all([Notification.findById(notificationId), Expense.findById(expenseId)]);
  if (!notification || !expense) throw new Error('Notification or expense not found.');
  if (notification.house.toString() !== expense.house.toString() || notification.user.toString() === expense.paidBy.toString() || notification.type.toLowerCase() !== 'expense' || Math.abs(notification.createdAt - expense.createdAt) > 60000) throw new Error('Notification cannot be reliably matched to this expense.');
  const creator = await User.findById(expense.paidBy).select('name');
  if (!creator) throw new Error('Expense creator not found.');
  notification.actor = creator._id;
  notification.message = `New ${expense.category} expense: ₹${expense.amount} added by ${creator.name}.`;
  notification.dedupeKey = `expense:${expense._id}`;
  await notification.save();
  console.log(`Repaired notification ${notification._id}.`);
  await mongoose.disconnect();
}

repairExpenseNotification().catch(async (error) => { console.error(error.message); await mongoose.disconnect(); process.exit(1); });
