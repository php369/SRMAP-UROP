// Script to check user role
const mongoose = require('mongoose');

// Define User schema inline
const UserSchema = new mongoose.Schema({
  email: String,
  name: String,
  role: String,
  isCoordinator: Boolean,
  isExternalEvaluator: Boolean
});

const User = mongoose.model('User', UserSchema);

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/srmap-project';

const emailToCheck = process.argv[2];

if (!emailToCheck) {
  console.log('Usage: node check-user-role.js <email>');
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const user = await User.findOne({ email: emailToCheck });
    
    if (!user) {
      console.log(`User not found: ${emailToCheck}`);
    } else {
      console.log('\nUser Details:');
      console.log(`  Email: ${user.email}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Is Coordinator: ${user.isCoordinator || false}`);
      console.log(`  Is External Evaluator: ${user.isExternalEvaluator || false}`);
      console.log(`  ID: ${user._id}`);
    }
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
