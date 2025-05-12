// Script to seed 72 students (4 years x 6 sections x 3 students) with users and student profiles
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Student = require('./models/Student');

const MONGO_URI = process.env.MONGO_URI;
const PASSWORD = 'abc123';
const SECTIONS = ['CSE-01', 'CSE-02', 'CSE-03', 'CSE-04', 'CSE-05', 'CSE-06'];
const YEARS = ['E-1', 'E-2', 'E-3', 'E-4'];

function getRandomPhone() {
  return (
    '9' + Math.floor(100000000 + Math.random() * 900000000).toString()
  );
}

async function seedStudents() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  let idNumber = 190001;
  let rollNo = 1;
  for (const year of YEARS) {
    for (const section of SECTIONS) {
      for (let i = 0; i < 3; i++) {
        const name = `Student_${year.replace('-', '')}_${section}_${i+1}`;
        const idNumStr = 'N' + idNumber.toString();
        const rollNumStr = rollNo.toString();
        const email = `${idNumStr.toLowerCase()}@rguktn.ac.in`;
        const phone = getRandomPhone();
        // Create user
        const user = new User({
          name,
          email,
          passwordHash,
          role: 'student',
        });
        await user.save();
        // Create student profile
        const student = new Student({
          userId: user._id,
          section: section,
          year,
          rollNo: rollNumStr,
          idNumber: idNumStr,
          phone
        });
        await student.save();
        idNumber++;
        rollNo++;
        if (rollNo > 60) rollNo = 1;
      }
    }
  }
  console.log('Seeded 72 students!');
  mongoose.disconnect();
}

seedStudents().catch(e => {
  console.error('Error seeding students:', e);
  process.exit(1);
});
