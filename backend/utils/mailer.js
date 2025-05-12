require('dotenv').config();

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendMail({ to, subject, text, html }) {
  const info = await transporter.sendMail({
    from: `Admin <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
  return info;
}

module.exports = { sendMail };
