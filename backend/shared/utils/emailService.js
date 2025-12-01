/**
 * Email Service
 * Template-based email sending with support for various providers
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Email service configuration
 * Replace with actual email provider (SendGrid, AWS SES, Mailgun, etc.)
 */
const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || 'noreply@mappalette.com',
  fromName: process.env.EMAIL_FROM_NAME || 'MapPalette',
  replyTo: process.env.EMAIL_REPLY_TO || 'support@mappalette.com',
  appUrl: process.env.APP_URL || 'https://mappalette.com',
};

/**
 * Load email template
 * @param {string} templateName - Template name (without .html extension)
 * @returns {string} - HTML template content
 */
const loadTemplate = async (templateName) => {
  const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.html`);
  const basePath = path.join(__dirname, '../templates/emails/base.html');

  const [template, base] = await Promise.all([
    fs.readFile(templatePath, 'utf-8'),
    fs.readFile(basePath, 'utf-8'),
  ]);

  return { template, base };
};

/**
 * Replace template variables
 * @param {string} template - Template string
 * @param {Object} variables - Variables to replace
 * @returns {string} - Processed template
 */
const replaceVariables = (template, variables) => {
  let result = template;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value || '');
  }

  return result;
};

/**
 * Send welcome email
 * @param {Object} options - Email options
 */
const sendWelcomeEmail = async (options) => {
  const { email, username } = options;

  const { template, base } = await loadTemplate('welcome');

  const variables = {
    username,
    appUrl: EMAIL_CONFIG.appUrl,
    title: 'Welcome to MapPalette',
  };

  const content = replaceVariables(template, variables);
  const html = replaceVariables(base, { ...variables, content });

  // TODO: Replace with actual email sending
  // Example with SendGrid:
  // const msg = {
  //   to: email,
  //   from: EMAIL_CONFIG.from,
  //   subject: 'Welcome to MapPalette!',
  //   html: html,
  // };
  // await sgMail.send(msg);

  if (global.logger) {
    global.logger.info('Welcome email sent', { email, username });
  }

  // For development, save to file
  if (process.env.NODE_ENV === 'development') {
    const outputPath = path.join(__dirname, '../../../logs', `email-${Date.now()}.html`);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, html);
    if (global.logger) {
      global.logger.info('Email saved to file', { path: outputPath });
    }
  }

  return { success: true, email, template: 'welcome' };
};

/**
 * Send password reset email
 * @param {Object} options - Email options
 */
const sendPasswordResetEmail = async (options) => {
  const { email, username, resetToken } = options;

  const { template, base } = await loadTemplate('password-reset');

  const resetUrl = `${EMAIL_CONFIG.appUrl}/reset-password?token=${resetToken}`;

  const variables = {
    username,
    resetUrl,
    appUrl: EMAIL_CONFIG.appUrl,
    title: 'Reset Your Password',
  };

  const content = replaceVariables(template, variables);
  const html = replaceVariables(base, { ...variables, content });

  // TODO: Replace with actual email sending

  if (global.logger) {
    global.logger.info('Password reset email sent', { email, username });
  }

  // For development, save to file
  if (process.env.NODE_ENV === 'development') {
    const outputPath = path.join(__dirname, '../../../logs', `email-${Date.now()}.html`);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, html);
  }

  return { success: true, email, template: 'password-reset' };
};

/**
 * Send new follower notification
 * @param {Object} options - Email options
 */
const sendNewFollowerEmail = async (options) => {
  const { email, username, followerUsername, followerProfilePicture, followerBio } = options;

  const { template, base } = await loadTemplate('new-follower');

  const variables = {
    username,
    followerUsername,
    followerProfilePicture: followerProfilePicture || `${EMAIL_CONFIG.appUrl}/default-avatar.png`,
    followerBio: followerBio || 'No bio yet',
    appUrl: EMAIL_CONFIG.appUrl,
    title: 'New Follower',
  };

  const content = replaceVariables(template, variables);
  const html = replaceVariables(base, { ...variables, content });

  // TODO: Replace with actual email sending

  if (global.logger) {
    global.logger.info('New follower email sent', { email, username, followerUsername });
  }

  return { success: true, email, template: 'new-follower' };
};

/**
 * Send new comment notification
 * @param {Object} options - Email options
 */
const sendNewCommentEmail = async (options) => {
  const { email, username, commenterUsername, routeName, routeId, commentContent } = options;

  const { template, base } = await loadTemplate('new-comment');

  const variables = {
    username,
    commenterUsername,
    routeName,
    routeId,
    commentContent,
    appUrl: EMAIL_CONFIG.appUrl,
    title: 'New Comment',
  };

  const content = replaceVariables(template, variables);
  const html = replaceVariables(base, { ...variables, content });

  // TODO: Replace with actual email sending

  if (global.logger) {
    global.logger.info('New comment email sent', { email, username, routeName });
  }

  return { success: true, email, template: 'new-comment' };
};

/**
 * Send custom email
 * @param {Object} options - Email options
 */
const sendCustomEmail = async (options) => {
  const { to, subject, html, text } = options;

  // TODO: Replace with actual email sending
  // const msg = {
  //   to,
  //   from: EMAIL_CONFIG.from,
  //   subject,
  //   html: html || text,
  //   text,
  // };
  // await sgMail.send(msg);

  if (global.logger) {
    global.logger.info('Custom email sent', { to, subject });
  }

  return { success: true, to, subject };
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendNewFollowerEmail,
  sendNewCommentEmail,
  sendCustomEmail,
  EMAIL_CONFIG,
};
