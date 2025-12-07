// Script to check existing windows in the database
const mongoose = require('mongoose');

// Define Window schema inline
const WindowSchema = new mongoose.Schema({
  windowType: {
    type: String,
    enum: ['proposal', 'application', 'submission', 'assessment', 'grade_release'],
    required: true
  },
  projectType: {
    type: String,
    enum: ['IDP', 'UROP', 'CAPSTONE'],
    required: true
  },
  assessmentType: {
    type: String,
    enum: ['A1', 'A2', 'A3', 'External']
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const Window = mongoose.model('Window', WindowSchema);

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/srmap-project';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find all windows
    const windows = await Window.find({}).sort({ createdAt: -1 });
    
    console.log(`\nFound ${windows.length} windows:\n`);
    
    windows.forEach((window, index) => {
      console.log(`${index + 1}. ${window.windowType} - ${window.projectType}`);
      console.log(`   Assessment Type: ${window.assessmentType || 'N/A'}`);
      console.log(`   Start: ${window.startDate}`);
      console.log(`   End: ${window.endDate}`);
      console.log(`   Active: ${window.isActive}`);
      console.log(`   ID: ${window._id}`);
      console.log('');
    });
    
    // Find proposal windows for IDP
    const idpProposalWindows = await Window.find({
      windowType: 'proposal',
      projectType: 'IDP'
    });
    
    console.log(`\nIDP Proposal Windows: ${idpProposalWindows.length}`);
    idpProposalWindows.forEach((window) => {
      console.log(`  - ${window.startDate} to ${window.endDate} (Active: ${window.isActive})`);
    });
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
