import axios from 'axios';
import { supabase } from '../config/supabase.js';

const TWO_FACTOR_API_KEY = process.env.TWO_FACTOR_API_KEY;

// User provided:
// Template Name: Templete1
// Sender ID: ZEKONI
const TEMPLATE_NAME = "Templete1";
const SENDER_ID = "ZEKONI";

export const sendOtpService = async (phoneNumber) => {
    // 1. Generate 4-digit OTP (Backend Method)
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const cleanPhone = phoneNumber.replace(/\+/g, '').replace(/^91/, '');
    const phoneForApi = cleanPhone.slice(-10);



    // 2. Call 2factor.in API
    if (TWO_FACTOR_API_KEY) {
        try {
            // Standard Endpoint: /SMS/{phone}/{otp}/{template_name}
            // This endpoint tells 2factor: "Send THIS specific OTP code using THIS template"
            const baseUrl = `https://2factor.in/API/V1/${TWO_FACTOR_API_KEY}/SMS/${phoneForApi}/${otp}/${TEMPLATE_NAME}`;

            // Append Sender ID
            const url = `${baseUrl}?from=${SENDER_ID}`;



            const response = await axios.get(url);

            if (response.data.Status !== 'Success') {
                console.error('2factor Error Response:', response.data);
                throw new Error('2factor Error: ' + response.data.Details);
            }


        } catch (apiError) {
            console.error('2factor.in API Error:', apiError.message);
            throw new Error(apiError.message || 'Failed to send SMS via provider');
        }
    } else {
        console.warn('TWO_FACTOR_API_KEY not found. Skipping SMS send.');
    }

    // 3. Save to DB (expires in 10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error } = await supabase
        .from('phone_verifications')
        .insert({
            phone_number: phoneNumber,
            otp_code: otp, // Storing the backend-generated OTP
            expires_at: expiresAt
        });

    if (error) throw new Error(`DB Error: ${error.message}`);

    return { message: 'OTP sent successfully' };
};

export const verifyOtpService = async (phoneNumber, userOtp) => {
    // 1. Get OTP from DB
    const { data, error } = await supabase
        .from('phone_verifications')
        .select('*')
        .eq('phone_number', phoneNumber)
        .eq('otp_code', userOtp) // Exact string match of the code we generated
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Invalid or expired OTP');

    // 2. Cleanup
    await supabase.from('phone_verifications').delete().eq('id', data.id);

    return { message: 'Phone verified successfully' };
};
