import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';

dotenv.config();

const demoPassword = 'password123';
const demoUsers = [
  { name: 'CourseHub Student', email: 'student@test.com', role: 'student' },
  { name: 'CourseHub Admin', email: 'admin@test.com', role: 'admin' },
];

const seed = async () => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required to seed demo accounts.');
  await mongoose.connect(process.env.MONGODB_URI);

  for (const demo of demoUsers) {
    const user = await User.findOne({ email: demo.email }) || new User({ email: demo.email });
    user.name = demo.name;
    user.role = demo.role;
    user.password = demoPassword;
    user.isActive = true;
    await user.save();
    console.log(`Seeded ${demo.role} demo account: ${demo.email}`);
  }
};

seed()
  .catch((error) => {
    console.error('Demo account seeding failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
