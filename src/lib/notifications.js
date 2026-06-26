import emailjs from '@emailjs/browser';

emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);

export async function sendStatusNotification({ citizenEmail, citizenName, location, status, officerNote, category }) {
  try {
    await emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
      {
        citizen_name: citizenName || 'Citizen',
        to_email: citizenEmail,
        location: location,
        status: status,
        officer_note: officerNote || 'No additional notes',
        category: category,
      }
    );
    return true;
  } catch (error) {
    console.error('Email notification failed:', error);
    return false;
  }
}

export function createInAppNotification(issueId, message, type) {
  const notifications = JSON.parse(localStorage.getItem('civicpulse_notifications') || '[]');
  notifications.unshift({
    id: Date.now(),
    issueId,
    message,
    type,
    read: false,
    createdAt: new Date().toISOString()
  });
  localStorage.setItem('civicpulse_notifications', JSON.stringify(notifications.slice(0, 50)));
}
