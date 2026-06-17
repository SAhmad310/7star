const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️ Email credentials not configured. Email sending disabled.');
    return null;
  }

  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send order confirmation to customer
const sendOrderConfirmation = async (order) => {
  const transporter = createTransporter();
  if (!transporter) return false;

  try {
    const serviceLabels = {
      'sticker-cutting': 'Sticker Cutting',
      'laser-cutting': 'Laser Cutting',
      'tshirt-printing': 'T-shirt Printing',
      'acrylic-nameplate': 'Acrylic Nameplate'
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0d0d0d; color: #d4a017; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f7f4ef; }
          .order-details { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #d4a017; }
          .status { display: inline-block; background: #d4a017; color: #0d0d0d; padding: 5px 15px; border-radius: 3px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌟 Seven Star Printing Press</h1>
            <h3>Order Confirmation</h3>
          </div>
          <div class="content">
            <h2>Thank you for your order, ${order.customer.name}!</h2>
            <p>We have received your order and will begin processing it shortly.</p>
            
            <div class="order-details">
              <h3>Order #${order.orderNumber}</h3>
              <p><strong>Service:</strong> ${serviceLabels[order.serviceType] || order.serviceType}</p>
              <p><strong>Quantity:</strong> ${order.specifications.quantity}</p>
              <p><strong>Status:</strong> <span class="status">Pending</span></p>
              <p><strong>Estimated Completion:</strong> ${new Date(order.estimatedCompletion).toLocaleDateString()}</p>
              ${order.specifications.additionalNotes ? `<p><strong>Special Instructions:</strong> ${order.specifications.additionalNotes}</p>` : ''}
            </div>
            
            <p><strong>What happens next?</strong></p>
            <ol>
              <li>We'll review your order within 2 business hours</li>
              <li>You'll receive a confirmation with estimated delivery date</li>
              <li>Our team will contact you if we need any clarifications</li>
            </ol>
            
            <p>If you have any questions, please reply to this email or contact us on WhatsApp.</p>
          </div>
          <div class="footer">
            <p>© 2025 Seven Star Printing Press. All rights reserved.</p>
            <p>Shop 12, Press Market, Main Bazaar, Lahore, Pakistan</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Seven Star Printing Press" <${process.env.EMAIL_USER}>`,
      to: order.customer.email,
      subject: `Order Confirmation #${order.orderNumber}`,
      html: html
    });

    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

// Send order status update to customer
const sendOrderStatusUpdate = async (order, oldStatus, newStatus) => {
  const transporter = createTransporter();
  if (!transporter) return false;

  try {
    const statusLabels = {
      'pending': 'Pending',
      'confirmed': 'Confirmed',
      'in_production': 'In Production',
      'ready': 'Ready for Delivery',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0d0d0d; color: #d4a017; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f7f4ef; }
          .status-update { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #d4a017; }
          .status-badge { display: inline-block; background: #d4a017; color: #0d0d0d; padding: 5px 15px; border-radius: 3px; font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌟 Seven Star Printing Press</h1>
          </div>
          <div class="content">
            <h2>Order Status Update</h2>
            <p>Dear ${order.customer.name},</p>
            <p>Your order <strong>#${order.orderNumber}</strong> has been updated.</p>
            
            <div class="status-update">
              <p><strong>Previous Status:</strong> ${statusLabels[oldStatus] || oldStatus}</p>
              <p><strong>New Status:</strong> <span class="status-badge">${statusLabels[newStatus] || newStatus}</span></p>
            </div>
            
            ${order.status === 'ready' ? `
              <p><strong>Your order is ready for delivery!</strong></p>
              <p>We will contact you shortly to arrange delivery.</p>
            ` : ''}
            
            ${order.status === 'delivered' ? `
              <p><strong>Your order has been delivered!</strong></p>
              <p>Thank you for choosing Seven Star Printing Press. We hope you love your products!</p>
            ` : ''}
            
            <p>If you have any questions, please reply to this email.</p>
          </div>
          <div class="footer">
            <p>© 2025 Seven Star Printing Press. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Seven Star Printing Press" <${process.env.EMAIL_USER}>`,
      to: order.customer.email,
      subject: `Order #${order.orderNumber} Status Update`,
      html: html
    });

    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

// Send contact form reply
const sendContactReply = async (contact) => {
  const transporter = createTransporter();
  if (!transporter) return false;

  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0d0d0d; color: #d4a017; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f7f4ef; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌟 Seven Star Printing Press</h1>
          </div>
          <div class="content">
            <h2>Thank you for contacting us!</h2>
            <p>Dear ${contact.name},</p>
            <p>Thank you for reaching out to Seven Star Printing Press.</p>
            
            <div style="background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #d4a017;">
              <p><strong>Your Message:</strong></p>
              <p style="background: #f0f0f0; padding: 15px; border-radius: 5px;">${contact.message}</p>
            </div>
            
            <p><strong>Our Response:</strong></p>
            <p style="background: #f0f0f0; padding: 15px; border-radius: 5px;">${contact.replyContent}</p>
            
            <p>We look forward to working with you!</p>
          </div>
          <div class="footer">
            <p>© 2025 Seven Star Printing Press. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Seven Star Printing Press" <${process.env.EMAIL_USER}>`,
      to: contact.email,
      subject: `Re: ${contact.subject || 'Your inquiry'}`,
      html: html
    });

    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

// Send new order notification to admin
const sendAdminNotification = async (order) => {
  const transporter = createTransporter();
  if (!transporter) return false;

  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0d0d0d; color: #d4a017; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f7f4ef; }
          .order-details { background: white; padding: 20px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌟 New Order Received</h1>
          </div>
          <div class="content">
            <h2>Order #${order.orderNumber}</h2>
            <div class="order-details">
              <p><strong>Customer:</strong> ${order.customer.name}</p>
              <p><strong>Email:</strong> ${order.customer.email}</p>
              <p><strong>Phone:</strong> ${order.customer.phone}</p>
              <p><strong>Service:</strong> ${order.serviceLabel}</p>
              <p><strong>Quantity:</strong> ${order.specifications.quantity}</p>
              <p><strong>Total Amount:</strong> PKR ${order.totalAmount}</p>
            </div>
            <p><a href="${process.env.CLIENT_URL}/admin" style="background: #d4a017; color: #0d0d0d; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View in Admin Panel</a></p>
          </div>
          <div class="footer">
            <p>Seven Star Printing Press Admin Notification</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Seven Star Printing Press" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL || 'admin@sevenstarpress.pk',
      subject: `New Order #${order.orderNumber}`,
      html: html
    });

    return true;
  } catch (error) {
    console.error('Admin email sending failed:', error);
    return false;
  }
};

module.exports = {
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  sendContactReply,
  sendAdminNotification
};