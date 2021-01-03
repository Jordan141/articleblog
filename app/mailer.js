const nodemailer = require('nodemailer')

async function init() {
    const testAccount = {
        user: 'clementina.stiedemann59@ethereal.email',
        pass: 'cnYvgw6VNMgMaesFzY'
    }

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.ethereal.email",
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER || testAccount.user,
            pass: process.env.EMAIL_PASS || testAccount.pass
        }
    })
}

async function sendMail(transporter, recipient, subject, body) {
    if(!transporter || !recipient || !subject || !body) throw new Error('sendMail: Invalid Parameters')
    const sender = process.env.EMAIL_SENDER || '"Article Blog" <Article@blog.com>'
    return transporter.sendMail({
        from: sender,
        to: recipient,
        subject,
        text: body
    })
}

function viewTestResponse(infoId) {
    return nodemailer.getTestMessageUrl(infoId)
}

module.exports = {
    init,
    sendMail,
    viewTestResponse
}