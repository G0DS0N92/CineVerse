import emailjs from '@emailjs/browser';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_cineverse';
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'cineverse_auth_otp';
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '-NZ5ZGoHWoNhhMb6W';

/**
 * Send 6-digit verification OTP to user via EmailJS
 * @param {string} toEmail 
 * @param {string} toName 
 * @param {string} otpCode 
 * @returns {Promise<{success: boolean, mode: 'emailjs' | 'demo', message?: string}>}
 */
export const sendVerificationOTP = async (toEmail, toName, otpCode) => {
  // If user hasn't configured EmailJS keys in environment yet, provide demo mode fallback
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.warn(
      `[CineVerse OTP Service] EmailJS credentials not set in environment. Demo OTP is: ${otpCode}`
    );
    return {
      success: true,
      mode: 'demo',
      otpCode,
      message: 'EmailJS keys not configured yet. Demo mode active.',
    };
  }

  try {
    const templateParams = {
      to_email: toEmail,
      email: toEmail,
      to_name: toName || 'Movie Fan',
      name: toName || 'Movie Fan',
      otp_code: otpCode,
      expiry_minutes: '5',
    };

    const res = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
    return {
      success: true,
      mode: 'emailjs',
      status: res.status,
      message: 'OTP sent successfully to your email!',
    };
  } catch (error) {
    console.error('[CineVerse OTP Service] EmailJS send error:', error);
    throw new Error(
      error?.text || error?.message || 'Failed to send verification email. Please check your EmailJS settings.'
    );
  }
};

/**
 * Send 6-digit confirmation code for account deletion via EmailJS
 * @param {string} toEmail 
 * @param {string} toName 
 * @param {string} otpCode 
 * @returns {Promise<{success: boolean, mode: 'emailjs' | 'demo', message?: string}>}
 */
export const sendAccountDeletionOTP = async (toEmail, toName, otpCode) => {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.warn(
      `[CineVerse OTP Service] EmailJS credentials not set. Demo deletion OTP is: ${otpCode}`
    );
    return {
      success: true,
      mode: 'demo',
      otpCode,
      message: 'EmailJS keys not configured. Demo mode active.',
    };
  }

  try {
    const templateParams = {
      to_email: toEmail,
      email: toEmail,
      to_name: toName || 'Movie Fan',
      name: toName || 'Movie Fan',
      otp_code: otpCode,
      expiry_minutes: '5',
    };

    const res = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
    return {
      success: true,
      mode: 'emailjs',
      status: res.status,
      message: 'Deletion verification code sent to your email!',
    };
  } catch (error) {
    console.error('[CineVerse OTP Service] EmailJS deletion send error:', error);
    throw new Error(
      error?.text || error?.message || 'Failed to send account deletion email. Please try again.'
    );
  }
};
