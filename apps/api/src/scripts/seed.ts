#!/usr/bin/env tsx

import mongoose from 'mongoose';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

// Import models
import { User, IUser } from '../models/User';
import { Course, ICourse } from '../models/Course';
import { Cohort, ICohort } from '../models/Cohort';
import { Assessment, IAssessment } from '../models/Assessment';
import { Submission, ISubmission } from '../models/Submission';
import { Grade, IGrade } from '../models/Grade';

/**
 * Comprehensive seed data script for SRM Project Portal
 * Creates demo users, courses, cohorts, assessments, submissions, and grades
 */

interface SeedData {
  users: {
    admin: IUser;
    faculty: IUser[];
    students: IUser[];
  };
  cohorts: ICohort[];
  courses: ICourse[];
  assessments: IAssessment[];
  submissions: ISubmission[];
  grades: IGrade[];
}

const seedData: Partial<SeedData> = {};

async function connectToDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.MONGODB_URI);
    logger.info('Connected to MongoDB for seeding');
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

async function clearExistingData(): Promise<void> {
  logger.info('🧹 Clearing existing data...');
  
  try {
    await Promise.all([
      Grade.deleteMany({}),
      Submission.deleteMany({}),
      Assessment.deleteMany({}),
      Course.deleteMany({}),
      Cohort.deleteMany({}),
      User.deleteMany({}),
    ]);
    
    logger.info('✅ Existing data cleared');
  } catch (error) {
    logger.error('Failed to clear existing data:', error);
    throw error;
  }
}

async function createUsers(): Promise<void> {
  logger.info('👥 Creating users...');

  // Create Admin User
  const admin = new User({
    googleId: 'admin_123456789',
    name: 'Dr. Admin Kumar',
    email: 'admin@srmap.edu.in',
    role: 'admin',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    profile: {
      department: 'Administration',
      bio: 'System Administrator for SRM Project Portal',
    },
    preferences: {
      theme: 'dark',
      notifications: true,
    },
  });

  // Create Faculty Users
  const facultyData = [
    {
      googleId: 'faculty_987654321',
      name: 'Dr. Priya Sharma',
      email: 'priya.sharma@srmap.edu.in',
      department: 'Computer Science',
      bio: 'Associate Professor specializing in Web Development and Software Engineering',
      skills: ['JavaScript', 'React', 'Node.js', 'Database Design'],
    },
    {
      googleId: 'faculty_456789123',
      name: 'Prof. Rajesh Gupta',
      email: 'rajesh.gupta@srmap.edu.in',
      department: 'Information Technology',
      bio: 'Professor of Information Technology with expertise in System Design',
      skills: ['System Architecture', 'Cloud Computing', 'DevOps', 'Microservices'],
    },
  ];

  const faculty = await Promise.all(
    facultyData.map(f => new User({
      googleId: f.googleId,
      name: f.name,
      email: f.email,
      role: 'faculty',
      avatarUrl: `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face`,
      profile: {
        department: f.department,
        bio: f.bio,
        skills: f.skills,
      },
      preferences: {
        theme: 'light',
        notifications: true,
      },
    }).save())
  );

  // Create Student Users
  const studentData = [
    {
      googleId: 'student_111111111',
      name: 'Arjun Patel',
      email: 'arjun.patel@srmap.edu.in',
      department: 'Computer Science',
      year: 3,
      skills: ['Python', 'React', 'Machine Learning'],
      bio: 'Third-year CS student passionate about AI and web development',
    },
    {
      googleId: 'student_222222222',
      name: 'Sneha Reddy',
      email: 'sneha.reddy@srmap.edu.in',
      department: 'Computer Science',
      year: 3,
      skills: ['Java', 'Spring Boot', 'Angular'],
      bio: 'CS student interested in full-stack development and cloud technologies',
    },
    {
      googleId: 'student_333333333',
      name: 'Vikram Singh',
      email: 'vikram.singh@srmap.edu.in',
      department: 'Information Technology',
      year: 2,
      skills: ['JavaScript', 'Vue.js', 'MongoDB'],
      bio: 'IT student exploring modern web technologies and databases',
    },
    {
      googleId: 'student_444444444',
      name: 'Ananya Iyer',
      email: 'ananya.iyer@srmap.edu.in',
      department: 'Computer Science',
      year: 4,
      skills: ['React Native', 'Flutter', 'Firebase'],
      bio: 'Final year CS student specializing in mobile app development',
    },
  ];

  const students = await Promise.all(
    studentData.map((s, index) => new User({
      googleId: s.googleId,
      name: s.name,
      email: s.email,
      role: 'student',
      avatarUrl: `https://images.unsplash.com/photo-${1494790108755 + index}?w=150&h=150&fit=crop&crop=face`,
      profile: {
        department: s.department,
        year: s.year,
        skills: s.skills,
        bio: s.bio,
      },
      preferences: {
        theme: index % 2 === 0 ? 'light' : 'dark',
        notifications: true,
      },
    }).save())
  );

  await admin.save();
  
  seedData.users = { admin, faculty, students };
  logger.info(`✅ Created ${1 + faculty.length + students.length} users`);
}

async function createCohorts(): Promise<void> {
  logger.info('🎓 Creating cohorts...');

  const cohortData = [
    {
      name: 'CS 2024 Batch',
      year: 2024,
      department: 'Computer Science',
      students: seedData.users!.students.filter(s => s.profile.department === 'Computer Science').map(s => s._id),
      faculty: [seedData.users!.faculty[0]._id], // Dr. Priya Sharma
    },
    {
      name: 'IT 2024 Batch',
      year: 2024,
      department: 'Information Technology',
      students: seedData.users!.students.filter(s => s.profile.department === 'Information Technology').map(s => s._id),
      faculty: [seedData.users!.faculty[1]._id], // Prof. Rajesh Gupta
    },
  ];

  const cohorts = await Promise.all(
    cohortData.map(c => new Cohort(c).save())
  );

  seedData.cohorts = cohorts;
  logger.info(`✅ Created ${cohorts.length} cohorts`);
}

async function createCourses(): Promise<void> {
  logger.info('📚 Creating courses...');

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const semester = currentMonth >= 8 ? 'Fall' : currentMonth <= 5 ? 'Spring' : 'Summer';

  const courseData = [
    {
      code: 'CS301',
      title: 'Web Development Fundamentals',
      description: 'Introduction to modern web development using HTML, CSS, JavaScript, and popular frameworks like React.',
      credits: 4,
      facultyId: seedData.users!.faculty[0]._id,
      cohorts: [seedData.cohorts![0]._id],
      semester,
      year: currentYear,
    },
    {
      code: 'CS401',
      title: 'Advanced Software Engineering',
      description: 'Advanced concepts in software engineering including design patterns, testing, and project management.',
      credits: 3,
      facultyId: seedData.users!.faculty[0]._id,
      cohorts: [seedData.cohorts![0]._id],
      semester,
      year: currentYear,
    },
    {
      code: 'IT302',
      title: 'System Design and Architecture',
      description: 'Comprehensive course on designing scalable systems and understanding software architecture patterns.',
      credits: 4,
      facultyId: seedData.users!.faculty[1]._id,
      cohorts: [seedData.cohorts![1]._id],
      semester,
      year: currentYear,
    },
  ];

  const courses = await Promise.all(
    courseData.map(c => new Course(c).save())
  );

  seedData.courses = courses;
  logger.info(`✅ Created ${courses.length} courses`);
}

async function createAssessments(): Promise<void> {
  logger.info('📝 Creating assessments...');

  const now = new Date();
  const assessmentData = [
    {
      courseId: seedData.courses![0]._id, // Web Development
      facultyId: seedData.users!.faculty[0]._id,
      title: 'React Portfolio Project',
      description: 'Create a personal portfolio website using React.js with at least 5 pages, responsive design, and modern UI components. Include a contact form and showcase your projects.',
      dueAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      meetUrl: 'https://meet.google.com/abc-defg-hij',
      calendarEventId: 'calendar_event_123',
      visibility: {
        cohortIds: [seedData.cohorts![0]._id],
        courseIds: [seedData.courses![0]._id],
      },
      settings: {
        allowLateSubmissions: false,
        maxFileSize: 50 * 1024 * 1024, // 50MB
        allowedFileTypes: ['zip', 'pdf', 'jpg', 'png'],
      },
      status: 'published' as const,
    },
    {
      courseId: seedData.courses![1]._id, // Software Engineering
      facultyId: seedData.users!.faculty[0]._id,
      title: 'Design Patterns Implementation',
      description: 'Implement at least 3 different design patterns (Singleton, Observer, Factory) in a Java application with proper documentation and unit tests.',
      dueAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      meetUrl: 'https://meet.google.com/xyz-uvw-rst',
      calendarEventId: 'calendar_event_456',
      visibility: {
        cohortIds: [seedData.cohorts![0]._id],
        courseIds: [seedData.courses![1]._id],
      },
      settings: {
        allowLateSubmissions: true,
        maxFileSize: 25 * 1024 * 1024, // 25MB
        allowedFileTypes: ['zip', 'pdf', 'doc', 'docx'],
      },
      status: 'published' as const,
    },
    {
      courseId: seedData.courses![2]._id, // System Design
      facultyId: seedData.users!.faculty[1]._id,
      title: 'Microservices Architecture Design',
      description: 'Design a microservices architecture for an e-commerce platform. Include API documentation, database design, and deployment strategy.',
      dueAt: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
      meetUrl: 'https://meet.google.com/lmn-opq-tuv',
      calendarEventId: 'calendar_event_789',
      visibility: {
        cohortIds: [seedData.cohorts![1]._id],
        courseIds: [seedData.courses![2]._id],
      },
      settings: {
        allowLateSubmissions: false,
        maxFileSize: 100 * 1024 * 1024, // 100MB
        allowedFileTypes: ['pdf', 'zip', 'doc', 'docx', 'jpg', 'png'],
      },
      status: 'published' as const,
    },
    {
      courseId: seedData.courses![0]._id, // Web Development
      facultyId: seedData.users!.faculty[0]._id,
      title: 'JavaScript Fundamentals Quiz',
      description: 'Online quiz covering JavaScript basics, ES6 features, and DOM manipulation. Duration: 60 minutes.',
      dueAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago (past due)
      meetUrl: 'https://meet.google.com/quiz-js-fund',
      calendarEventId: 'calendar_event_quiz_123',
      visibility: {
        cohortIds: [seedData.cohorts![0]._id],
        courseIds: [seedData.courses![0]._id],
      },
      settings: {
        allowLateSubmissions: false,
        maxFileSize: 5 * 1024 * 1024, // 5MB
        allowedFileTypes: ['pdf', 'txt'],
      },
      status: 'closed' as const,
    },
  ];

  const assessments = await Promise.all(
    assessmentData.map(a => new Assessment(a).save())
  );

  seedData.assessments = assessments;
  logger.info(`✅ Created ${assessments.length} assessments`);
}

async function createSubmissions(): Promise<void> {
  logger.info('📤 Creating submissions...');

  const submissionData = [
    // Submissions for React Portfolio Project
    {
      assessmentId: seedData.assessments![0]._id,
      studentId: seedData.users!.students[0]._id, // Arjun Patel
      files: [
        {
          url: 'https://res.cloudinary.com/srm-portal/raw/upload/v1234567890/submissions/arjun-portfolio.zip',
          name: 'arjun-portfolio-project.zip',
          size: 15728640, // 15MB
          contentType: 'application/zip',
          cloudinaryId: 'submissions/arjun-portfolio',
        },
        {
          url: 'https://res.cloudinary.com/srm-portal/raw/upload/v1234567890/submissions/arjun-readme.pdf',
          name: 'README.pdf',
          size: 524288, // 512KB
          contentType: 'application/pdf',
          cloudinaryId: 'submissions/arjun-readme',
        },
      ],
      notes: 'I have implemented all required features including responsive design, contact form, and project showcase. The portfolio includes 6 pages and uses modern React hooks.',
      submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      status: 'graded' as const,
      metadata: {
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        fileCount: 2,
        totalSize: 16252928,
      },
    },
    {
      assessmentId: seedData.assessments![0]._id,
      studentId: seedData.users!.students[1]._id, // Sneha Reddy
      files: [
        {
          url: 'https://res.cloudinary.com/srm-portal/raw/upload/v1234567890/submissions/sneha-portfolio.zip',
          name: 'sneha-react-portfolio.zip',
          size: 18874368, // 18MB
          contentType: 'application/zip',
          cloudinaryId: 'submissions/sneha-portfolio',
        },
      ],
      notes: 'My portfolio showcases 5 projects with detailed descriptions. I used React Router for navigation and implemented a dark/light theme toggle.',
      submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      status: 'submitted' as const,
      metadata: {
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        fileCount: 1,
        totalSize: 18874368,
      },
    },
    // Submission for JavaScript Quiz (past due)
    {
      assessmentId: seedData.assessments![3]._id,
      studentId: seedData.users!.students[0]._id, // Arjun Patel
      files: [
        {
          url: 'https://res.cloudinary.com/srm-portal/raw/upload/v1234567890/submissions/arjun-js-quiz.pdf',
          name: 'javascript-quiz-answers.pdf',
          size: 1048576, // 1MB
          contentType: 'application/pdf',
          cloudinaryId: 'submissions/arjun-js-quiz',
        },
      ],
      notes: 'Completed the JavaScript fundamentals quiz. Covered all topics including ES6 features and DOM manipulation.',
      submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      status: 'graded' as const,
      metadata: {
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        fileCount: 1,
        totalSize: 1048576,
      },
    },
    {
      assessmentId: seedData.assessments![3]._id,
      studentId: seedData.users!.students[1]._id, // Sneha Reddy
      files: [
        {
          url: 'https://res.cloudinary.com/srm-portal/raw/upload/v1234567890/submissions/sneha-js-quiz.pdf',
          name: 'js-fundamentals-quiz.pdf',
          size: 786432, // 768KB
          contentType: 'application/pdf',
          cloudinaryId: 'submissions/sneha-js-quiz',
        },
      ],
      notes: 'Quiz submission with detailed explanations for each answer.',
      submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      status: 'graded' as const,
      metadata: {
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        fileCount: 1,
        totalSize: 786432,
      },
    },
  ];

  const submissions = await Promise.all(
    submissionData.map(s => new Submission(s).save())
  );

  seedData.submissions = submissions;
  logger.info(`✅ Created ${submissions.length} submissions`);
}

async function createGrades(): Promise<void> {
  logger.info('📊 Creating grades...');

  const gradeData = [
    // Grade for Arjun's React Portfolio
    {
      submissionId: seedData.submissions![0]._id,
      facultyId: seedData.users!.faculty[0]._id,
      score: 92,
      maxScore: 100,
      rubric: [
        {
          criteria: 'Code Quality and Structure',
          points: 23,
          maxPoints: 25,
          feedback: 'Well-organized code with proper component structure. Good use of React hooks.',
        },
        {
          criteria: 'User Interface Design',
          points: 22,
          maxPoints: 25,
          feedback: 'Excellent responsive design and modern UI components. Great color scheme.',
        },
        {
          criteria: 'Functionality and Features',
          points: 24,
          maxPoints: 25,
          feedback: 'All required features implemented correctly. Contact form works perfectly.',
        },
        {
          criteria: 'Documentation and Presentation',
          points: 23,
          maxPoints: 25,
          feedback: 'Good documentation and clear project presentation. README could be more detailed.',
        },
      ],
      comments: 'Excellent work on the portfolio project! Your code is well-structured and the design is modern and responsive. The functionality meets all requirements. Consider adding more detailed documentation for future projects.',
      gradedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
    // Grade for Arjun's JavaScript Quiz
    {
      submissionId: seedData.submissions![2]._id,
      facultyId: seedData.users!.faculty[0]._id,
      score: 85,
      maxScore: 100,
      rubric: [
        {
          criteria: 'Basic JavaScript Concepts',
          points: 22,
          maxPoints: 25,
          feedback: 'Good understanding of variables, functions, and data types.',
        },
        {
          criteria: 'ES6 Features',
          points: 20,
          maxPoints: 25,
          feedback: 'Solid grasp of arrow functions and destructuring. Need to review template literals.',
        },
        {
          criteria: 'DOM Manipulation',
          points: 23,
          maxPoints: 25,
          feedback: 'Excellent understanding of DOM methods and event handling.',
        },
        {
          criteria: 'Problem Solving',
          points: 20,
          maxPoints: 25,
          feedback: 'Good problem-solving approach. Some logical errors in complex scenarios.',
        },
      ],
      comments: 'Good performance on the JavaScript fundamentals quiz. You have a solid understanding of most concepts. Focus on ES6 features and complex problem-solving for improvement.',
      gradedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
    // Grade for Sneha's JavaScript Quiz
    {
      submissionId: seedData.submissions![3]._id,
      facultyId: seedData.users!.faculty[0]._id,
      score: 94,
      maxScore: 100,
      rubric: [
        {
          criteria: 'Basic JavaScript Concepts',
          points: 25,
          maxPoints: 25,
          feedback: 'Perfect understanding of fundamental concepts.',
        },
        {
          criteria: 'ES6 Features',
          points: 24,
          maxPoints: 25,
          feedback: 'Excellent knowledge of ES6 features with detailed explanations.',
        },
        {
          criteria: 'DOM Manipulation',
          points: 23,
          maxPoints: 25,
          feedback: 'Very good understanding with practical examples.',
        },
        {
          criteria: 'Problem Solving',
          points: 22,
          maxPoints: 25,
          feedback: 'Strong problem-solving skills with clear reasoning.',
        },
      ],
      comments: 'Outstanding performance! Your understanding of JavaScript concepts is excellent, and your explanations show deep knowledge. Keep up the great work!',
      gradedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
  ];

  const grades = await Promise.all(
    gradeData.map(g => new Grade(g).save())
  );

  // Update submission statuses to 'graded'
  await Promise.all([
    Submission.findByIdAndUpdate(seedData.submissions![0]._id, { status: 'graded' }),
    Submission.findByIdAndUpdate(seedData.submissions![2]._id, { status: 'graded' }),
    Submission.findByIdAndUpdate(seedData.submissions![3]._id, { status: 'graded' }),
  ]);

  seedData.grades = grades;
  logger.info(`✅ Created ${grades.length} grades`);
}

async function displaySeedSummary(): Promise<void> {
  logger.info('\n🎉 Seed data creation completed successfully!');
  logger.info('=' .repeat(50));
  
  const summary = {
    users: {
      admin: 1,
      faculty: seedData.users!.faculty.length,
      students: seedData.users!.students.length,
    },
    cohorts: seedData.cohorts!.length,
    courses: seedData.courses!.length,
    assessments: seedData.assessments!.length,
    submissions: seedData.submissions!.length,
    grades: seedData.grades!.length,
  };

  console.log('\n📊 Summary:');
  console.log(`👤 Users: ${summary.users.admin} admin, ${summary.users.faculty} faculty, ${summary.users.students} students`);
  console.log(`🎓 Cohorts: ${summary.cohorts}`);
  console.log(`📚 Courses: ${summary.courses}`);
  console.log(`📝 Assessments: ${summary.assessments}`);
  console.log(`📤 Submissions: ${summary.submissions}`);
  console.log(`📊 Grades: ${summary.grades}`);

  console.log('\n🔑 Demo Login Credentials:');
  console.log('Admin: admin@srmap.edu.in');
  console.log('Faculty: priya.sharma@srmap.edu.in, rajesh.gupta@srmap.edu.in');
  console.log('Students: arjun.patel@srmap.edu.in, sneha.reddy@srmap.edu.in, vikram.singh@srmap.edu.in, ananya.iyer@srmap.edu.in');

  console.log('\n📋 Available Data:');
  console.log('• Published assessments with Meet links');
  console.log('• Sample submissions with realistic file metadata');
  console.log('• Graded submissions with detailed rubrics');
  console.log('• Cohort and course relationships');
  console.log('• User profiles with skills and bio information');
}

async function main(): Promise<void> {
  try {
    logger.info('🌱 Starting SRM Project Portal seed data creation...');
    
    await connectToDatabase();
    await clearExistingData();
    
    // Create data in dependency order
    await createUsers();
    await createCohorts();
    await createCourses();
    await createAssessments();
    await createSubmissions();
    await createGrades();
    
    await displaySeedSummary();
    
    logger.info('\n✅ Seed data creation completed successfully!');
    process.exit(0);
    
  } catch (error) {
    logger.error('❌ Seed data creation failed:', error);
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  main();
}

export { main as seedDatabase };