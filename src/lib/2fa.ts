import twilio from 'twilio';
import crypto from 'crypto';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !twilioPhoneNumber) {
  console.warn('Twilio credentials are not configured. SMS 2FA will not work.');
}

const client = twilio(accountSid, authToken);

// Function to generate a random OTP
export function generateOTP(length = 6): string {
  const buffer = crypto.randomBytes(Math.ceil(length / 2));
  const otp = buffer.toString('hex').slice(0, length).toUpperCase();
  return otp;
}

// Function to send SMS using Twilio
export async function sendSMS(
  phoneNumber: string,
  message: string,
): Promise<boolean> {
  if (!accountSid || !authToken || !twilioPhoneNumber) {
    console.warn('Twilio credentials are not configured. SMS sending skipped.');
    return false;
  }

  try {
    await client.messages.create({
      body: message,
      to: phoneNumber,
      from: twilioPhoneNumber,
    });
    return true;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
}

// Function to verify OTP (This is a placeholder, implement proper verification logic)
export function verifyOTP(otp: string, expectedOtp: string): boolean {
  return otp === expectedOtp;
}
