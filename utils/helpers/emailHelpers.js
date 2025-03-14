const nodemailer = require('nodemailer');

// Function to configure the email transporter
function configurarTransporter() {
  console.log('EMAIL_USER', process.env.EMAIL_USER)
  console.log('EMAIL_PASS', process.env.EMAIL_PASS)
  return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
          user: process.env.EMAIL_USER, // Your email
          pass: process.env.EMAIL_PASS // Your email password
      },
  });
}

// Create the email transporter
const emailTransporter = configurarTransporter();


//Email template and required fields
const emailTemplates = {
    newROOTAccountMail: {
      template: (data) => `Hello,\n\n` +
        `Work environment for Company ${data.companyName} created.\n` +
        `Use the login below to start preparing this environment.\n` +
        `\tLogin: Admin\n` +
        `\tPassword: ${data.password}\n\n` +
        `Yours sincerely,\n` +
        `General system administrator.`,
      requiredFields: ['companyName', 'password'], // Campos necessários
    },
    
    newAdminAccountMail: {
      template: (data) => `Hello,\n\n` +
        `Work environment for Company ${data.companyName} created.\n` +
        `Use the login below to start preparing this environment.\n` +
        `\tLogin: Admin\n` +
        `\tPassword: ${data.password}\n\n` +
        `Yours sincerely,\n` +
        `General system administrator.`,
      requiredFields: ['companyName', 'password'], // Campos necessários
    },
    
    newUserAccountMail: {
      template: (data) => `Hello,\n\n` +
        `Work environment for Company ${data.companyName} created.\n` +
        `Use the login below to start preparing this environment.\n` +
        `\tLogin: Admin\n` +
        `\tPassword: ${data.password}\n\n` +
        `Yours sincerely,\n` +
        `General system administrator.`,
      requiredFields: ['companyName', 'password'], // Campos necessários
    },
  };

// Function to validate data
function validateEmailData(templateKey, data) {
    const template = emailTemplates[templateKey];
    if (!template) {
      return {
        success: false,
        message: `Email template '${templateKey}' not found.`,
      };
    }

    // Checks that mandatory properties (subject and recipient) exist
    const requiredBaseFields = ['subject', 'recipient'];
    const missingBaseFields = requiredBaseFields.filter((field) => !(field in data));
    if (missingBaseFields.length > 0) {
        return {
        success: false,
        message: `Missing required fields: ${missingBaseFields.join(', ')}`,
        };
    }

    // Validates if the recipient field is a valid email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.recipient)) {
        return {
        success: false,
        message: `Invalid email format for recipient: ${data.recipient}`,
        };
    }
  
    const missingFields = template.requiredFields.filter((field) => !(field in data));
    if (missingFields.length > 0) {
      return {
        success: false,
        message: `Missing required fields for template '${templateKey}': ${missingFields.join(', ')}`,
      };
    }
  
    return {
      success: true,
      message: 'Validation passed.',
    };
  }



// Function for sending email
async function sendEmailbyTemplate(emailData, emailTemplateKey) {
    const validationResult = validateEmailData(emailTemplateKey, emailData);

    if (!validationResult.success) {
      return {
        success: false,
        message: validationResult.message,
        data: '',
        unexpected: false
      };
    }
  
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: emailData.recipient,
      subject: emailData.subject,
      text: emailTemplates[emailTemplateKey].template(emailData), 
    };
  
    try {
      const info = await emailTransporter.sendMail(mailOptions);
      console.log('Email sent: ' + info.response);
      return {
        success: true,
        message: 'Email sent: ' + info.response,
        data: '',
        unexpected: false
      };
    } catch (error) {
      console.error('Email not sent: ' + error);
      return { 
        success: false,  
        message: 'Email not sent: ' + error.message,
        data: '',
        unexpected: true
      };
    }
  }
  
  module.exports = { sendEmailbyTemplate };
