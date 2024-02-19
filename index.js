const express = require('express');
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
const cors = require('cors');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.use(
  cors({
    origin: 'http://localhost:3000'
  })
)

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'your_email@gmail.com', // Enter your Gmail address
    pass: 'your_password' // Enter your Gmail password
  }
});

// Generate random verification code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000);
}

// Store verification codes temporarily
const verificationCodes = new Map();

// Create a new user
app.post('/users', async (req, res) => {
  const { firstName, lastName, socialProtocolPreference, email } = req.body;
  try {
    if (!firstName || !lastName || !socialProtocolPreference || !email) {
      throw new Error('Missing required fields.');
    }

    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        socialProtocolPreference,
        email
      }
    });
    res.status(200).json(newUser);
  } catch (error) {
    if (!firstName || !lastName || !socialProtocolPreference || !email) {
      res.status(400).json({ error: 'Missing required fields.' });
    } else {
      res.status(500).json({ error: 'Could not create user.' });
    }
  }
});

// Send verification code to user's email
app.post('/send-verification-code', async (req, res) => {
  const { email } = req.body;
  const verificationCode = generateVerificationCode();

  try {
    await transporter.sendMail({
      from: 'your_email@gmail.com', // Sender's email address
      to: email,
      subject: 'Verification Code',
      text: `Your verification code is: ${verificationCode}`
    });

    verificationCodes.set(email, verificationCode);
    res.json({ message: 'Verification code sent successfully.' });
  } catch (error) {
    console.error('Error sending verification code:', error);
    res.status(500).json({ error: 'Could not send verification code.' });
  }
});

// Verify email with verification code and allow user to edit data
app.post('/verify-email', async (req, res) => {
  const { email, verificationCode } = req.body;

  if (verificationCodes.has(email) && verificationCodes.get(email) == verificationCode) {
    verificationCodes.delete(email);
    res.json({ message: 'Email verified successfully. You can now edit your data.' });
  } else {
    res.status(400).json({ error: 'Invalid verification code.' });
  }
});

// Update user data
app.put('/users/:id', async (req, res) => {
  const userId = parseInt(req.params.id);
  const { firstName, lastName, socialProtocolPreference } = req.body;
  try {
    if (!firstName || !lastName || !socialProtocolPreference || !email) {
        throw new Error('Missing required fields.');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        socialProtocolPreference
      }
    });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Could not update user.' });
  }
});

// Get all users
app.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Could not retrieve users.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});