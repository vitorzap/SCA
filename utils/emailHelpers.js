const nodemailer = require('nodemailer');

function configurarTransporter() {
    let transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        auth: {
            user: process.env.EMAIL_USER, // Seu e-mail
            pass: process.env.EMAIL_PASS // Sua senha
        },
    });

    return transporter;
}

module.exports = configurarTransporter;
