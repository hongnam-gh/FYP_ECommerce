import nodemailer from 'nodemailer'
import path from 'path'
import { fileURLToPath } from 'url'

// ------ Config --------

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const logoPath = path.resolve(__dirname, '../../frontend/src/assets/distressed-logo.png')
const logoCid = 'distressed-logo'

// ------ Business Helpers --------

const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    })
}

const formatMoney = (amount) => `$${Number(amount || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`
const getItemImage = (item) => Array.isArray(item.image) ? item.image[0] : item.image
const getEmailItemImage = (item) => {
    const image = getItemImage(item)
    if (!image) return ''
    if (!image.includes('/image/upload/')) return image
    return image.replace('/image/upload/', '/image/upload/c_pad,w_188,h_244,b_white,g_south/')
}
const getCustomerName = (address) => `${address?.firstName || ''} ${address?.lastName || ''}`.trim() || 'Valued Customer'
const getCustomerAddress = (address) => `${address?.street || ''}, ${address?.city || ''}, ${address?.state || ''}, ${address?.country || ''}, ${address?.zipcode || ''}`
const getLogoHtml = (dark = false) => `
    <div style="text-align:center;">
        <img src="cid:${logoCid}" alt="Distressed" width="165" style="width:165px;height:60px;object-fit:cover;object-position:center 48%;display:block;margin:0 auto;padding:5px;border-radius:14px;background:#ffffff;" />
        ${dark ? '<p style="margin:14px 0 0;color:#bbbbbb;font-size:14px;">Your order has been confirmed</p>' : '<div style="width:60px;height:2px;background:#111111;margin:20px auto;"></div>'}
    </div>
`
const logoAttachment = [{ filename: 'distressed-logo.png', path: logoPath, cid: logoCid }]

// ------ Public Services --------

const sendResetPasswordEmail = async (email, resetLink) => {
    const transporter = createTransporter()

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Reset Your Password | Distressed',
        attachments: logoAttachment,
        html: `
        <div style="max-width:600px;margin:0 auto;padding:40px 20px;background:#f8f8f8;font-family:Arial,sans-serif;">
            <div style="background:#ffffff;padding:40px;border-radius:12px;text-align:center;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
                ${getLogoHtml()}
                <h2 style="color:#111111;font-weight:500;margin-bottom:20px;">Password Reset Request</h2>
                <p style="color:#666666;line-height:1.8;margin-bottom:10px;">We received a request to reset the password associated with your account.</p>
                <p style="color:#666666;line-height:1.8;margin-bottom:30px;">Click the button below to create a new password.</p>
                <a href="${resetLink}" style="display:inline-block;background:#111111;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:500;">Reset Password</a>
                <p style="color:#999999;font-size:13px;margin-top:35px;line-height:1.7;">This password reset link will expire in 15 minutes.</p>
                <p style="color:#999999;font-size:13px;line-height:1.7;">If you did not request a password reset, you can safely ignore this email.</p>
            </div>
            <p style="text-align:center;color:#999999;font-size:12px;margin-top:20px;">© Distressed. All rights reserved.</p>
        </div>
    `
    }

    await transporter.sendMail(mailOptions)
}

const sendOrderConfirmationEmail = async (order) => {
    if (!order?.address?.email) return

    const transporter = createTransporter()
    const customerName = getCustomerName(order.address)

    const itemsHtml = order.items.map((item) => `
        <tr>
            <td style="padding:16px 0;border-bottom:1px solid #eeeeee;">
                <table width="100%" style="border-collapse:collapse;">
                    <tr>
                        <td width="112" style="vertical-align:top;">
                            <table width="96" height="124" style="width:96px;height:124px;border-collapse:collapse;border-radius:14px;border:1px solid #eeeeee;background:#ffffff;overflow:hidden;">
                                <tr>
                                    <td align="center" valign="bottom" style="width:96px;height:124px;padding:0;line-height:0;">
                                        <img src="${getEmailItemImage(item)}" alt="${item.name}" width="94" height="122" style="width:94px;height:122px;border:0;display:block;" />
                                    </td>
                                </tr>
                            </table>
                        </td>
                        <td style="padding-left:10px;vertical-align:top;">
                            <p style="margin:0 0 6px;color:#111111;font-size:15px;font-weight:700;">${item.name}</p>
                            <p style="margin:0;color:#777777;font-size:13px;line-height:1.6;">Size: ${item.size || 'N/A'} • Quantity: ${item.quantity}</p>
                            <p style="margin:8px 0 0;color:#111111;font-size:14px;font-weight:700;">${formatMoney(item.price)}</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    `).join('')

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: order.address.email,
        subject: 'Order Confirmation | Distressed',
        attachments: logoAttachment,
        html: `
        <div style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
            <div style="max-width:680px;margin:0 auto;padding:34px 16px;">
                <div style="background:#111111;padding:34px 28px;border-radius:22px 22px 0 0;text-align:center;">
                    ${getLogoHtml(true)}
                </div>

                <div style="background:#ffffff;padding:30px;border-radius:0 0 22px 22px;box-shadow:0 10px 30px rgba(0,0,0,0.08);">
                    <h2 style="margin:0;color:#111111;font-size:24px;">Thank You, ${customerName}.</h2>
                    <p style="color:#666666;line-height:1.7;font-size:14px;">We truly appreciate your order and will process it soon. Here is your order summary.</p>

                    <div style="margin:24px 0;padding:18px;border-radius:16px;background:#f8f8f8;">
                        <p style="margin:0 0 8px;color:#111111;font-size:14px;"><b>Payment:</b> ${order.paymentMethod}</p>
                        <p style="margin:0 0 8px;color:#111111;font-size:14px;"><b>Status:</b> ${order.status}</p>
                        <p style="margin:0;color:#111111;font-size:14px;"><b>Total:</b> ${formatMoney(order.amount)}</p>
                    </div>

                    <table width="100%" style="border-collapse:collapse;">${itemsHtml}</table>

                    <div style="margin-top:26px;padding:20px;border-radius:16px;border:1px solid #eeeeee;">
                        <h3 style="margin:0 0 12px;color:#111111;font-size:16px;">Delivery Information</h3>
                        <p style="margin:0 0 8px;color:#666666;font-size:14px;line-height:1.8;"><b style="color:#111111;">Customer Name:</b> ${customerName}</p>
                        <p style="margin:0 0 8px;color:#666666;font-size:14px;line-height:1.8;"><b style="color:#111111;">Address:</b> ${getCustomerAddress(order.address)}</p>
                        <p style="margin:0;color:#666666;font-size:14px;line-height:1.8;"><b style="color:#111111;">Phone Number:</b> ${order.address.phone}</p>
                    </div>

                    <p style="margin-top:28px;text-align:center;color:#999999;font-size:12px;">© Distressed. All rights reserved.</p>
                </div>
            </div>
        </div>
    `
    }

    await transporter.sendMail(mailOptions)
}

export { sendResetPasswordEmail, sendOrderConfirmationEmail }
