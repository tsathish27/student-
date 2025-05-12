// Script to backfill submittedAt for QuizAttempt documents missing this field
const mongoose = require('mongoose');
const QuizAttempt = require('../models/QuizAttempt');

const MONGO_URI = process.env.MONGO_URI;

async function backfillSubmittedAt() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const filter = { $or: [ { submittedAt: { $exists: false } }, { submittedAt: null } ] };
  const attempts = await QuizAttempt.find(filter);
  console.log(`Found ${attempts.length} QuizAttempts to update.`);

  for (const attempt of attempts) {
    // Use createdAt if present, otherwise updatedAt, otherwise now
    const fallback = attempt.createdAt || attempt.updatedAt || new Date();
    attempt.submittedAt = fallback;
    await attempt.save();
    console.log(`Updated QuizAttempt ${attempt._id}: submittedAt -> ${attempt.submittedAt}`);
  }

  await mongoose.disconnect();
  console.log('Backfill complete.');
}

backfillSubmittedAt().catch(err => {
  console.error('Error during backfill:', err);
  process.exit(1);
});
