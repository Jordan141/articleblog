const nodemailer = require('nodemailer')

async function init() {
    const testAccount = await nodemailer.createTestAccount()

    return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass
        }
    })
}

async function sendMail(transporter, recipient, subject, body) {
    if(!transporter || !recipient || !subject || !body) throw new Error('sendMail: Invalid Parameters')
    return transporter.sendMail({
        from: '"Article Blog" <Article@blog.com>',
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