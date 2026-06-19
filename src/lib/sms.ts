/**
 * SMS service integration for Bangladesh (SSL Wireless API).
 * Falls back to console.log in development when SMS_API_KEY is not set.
 */

const SSL_WIRELESS_URL = "https://sms.sslwireless.com/api/v3/sendSms";

interface SMSPayload {
  api_key: string;
  senderid: string;
  type: string;
  number: string;
  message: string;
}

/**
 * Send an SMS to a phone number.
 * Uses SSL Wireless API for Bangladesh.
 * Falls back to console.log in development if credentials are missing.
 */
export async function sendSMS(phone: string, message: string): Promise<void> {
  const apiKey = process.env.SMS_API_KEY;
  const senderId = process.env.SMS_SENDER_ID;

  // Fallback: log in development
  if (!apiKey || !senderId) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[SMS Dev] To: ${phone} | Message: ${message}`);
    }
    return;
  }

  // Clean phone number — remove +880 prefix if present, ensure format
  let cleanPhone = phone.trim();
  if (cleanPhone.startsWith("+880")) {
    cleanPhone = cleanPhone.slice(4);
  } else if (cleanPhone.startsWith("880")) {
    cleanPhone = cleanPhone.slice(3);
  }
  if (cleanPhone.startsWith("0")) {
    cleanPhone = "880" + cleanPhone.slice(1);
  } else {
    cleanPhone = "880" + cleanPhone;
  }

  try {
    const payload: SMSPayload = {
      api_key: apiKey,
      senderid: senderId,
      type: "text",
      number: cleanPhone,
      message,
    };

    const response = await fetch(SSL_WIRELESS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`[SMS] Failed to send to ${cleanPhone}: HTTP ${response.status}`);
    } else {
      const result = await response.json();
      if (result.status !== "success" && result.status !== 200) {
        console.error(`[SMS] API error for ${cleanPhone}:`, result);
      }
    }
  } catch (error) {
    console.error(`[SMS] Network error sending to ${cleanPhone}:`, error);
  }
}

/**
 * Pre-defined SMS templates in Bengali.
 */
export const SMS_TEMPLATES = {
  appointmentConfirmed: (doctorName: string, date: string, serial: number) =>
    `আপনার অ্যাপয়েন্টমেন্ট নিশ্চিত হয়েছে। ডাক্তার: ${doctorName}, তারিখ: ${date}, সিরিয়াল নম্বর: ${serial}। — MediFlow`,

  queueAlert: (serial: number, doctorName: string) =>
    `আপনার পালা আসছে! সিরিয়াল নম্বর: ${serial}, ডাক্তার: ${doctorName}। অনুগ্রহ করে চেম্বারে যান। — MediFlow`,

  appointmentCancelled: (doctorName: string, date: string) =>
    `আপনার অ্যাপয়েন্টমেন্ট বাতিল হয়েছে। ডাক্তার: ${doctorName}, তারিখ: ${date}। — MediFlow`,

  doctorStatusChange: (doctorName: string, status: string) =>
    `ডাক্তার ${doctorName} এখন ${status}। — MediFlow`,
};
