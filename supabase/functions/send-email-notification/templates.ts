export interface EmailTemplateData {
  alertType?: string;
  location?: string;
  description?: string;
  timestamp?: string;
  senderName?: string;
  messagePreview?: string;
  appUrl?: string;
  authorName?: string;
  title?: string;
  content?: string;
}

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #333;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
`;

export function generateEmailTemplate(type: string, data: EmailTemplateData): string {
  const templates: Record<string, string> = {
    emergency_alert: `
      <div style="${baseStyle}">
        <div style="background: #dc2626; color: white; padding: 20px; border-radius: 8px;">
          <h2 style="margin: 0;">🚨 Emergency Alert</h2>
        </div>
        <div style="padding: 20px; background: #fef2f2; margin-top: 16px; border-radius: 8px;">
          <p><strong>Type:</strong> ${data.alertType || 'Emergency'}</p>
          <p><strong>Location:</strong> ${data.location || 'Unknown'}</p>
          <p><strong>Description:</strong> ${data.description || 'No description provided'}</p>
          <p><strong>Time:</strong> ${data.timestamp ? new Date(data.timestamp).toLocaleString() : new Date().toLocaleString()}</p>
        </div>
        <p style="margin-top: 20px;">Stay safe and follow local authorities' instructions.</p>
        <a href="${data.appUrl || window.location.origin}/safety" 
           style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; margin-top: 16px;">
          View Alert
        </a>
      </div>
    `,
    
    panic_alert: `
      <div style="${baseStyle}">
        <div style="background: #dc2626; color: white; padding: 20px; border-radius: 8px;">
          <h2 style="margin: 0;">⚠️ Panic Alert Activated</h2>
        </div>
        <div style="padding: 20px; background: #fef2f2; margin-top: 16px; border-radius: 8px;">
          <p><strong>Location:</strong> ${data.location || 'Unknown'}</p>
          <p><strong>Time:</strong> ${data.timestamp ? new Date(data.timestamp).toLocaleString() : new Date().toLocaleString()}</p>
          <p style="color: #dc2626; font-weight: bold;">Someone in your area needs immediate assistance!</p>
        </div>
        <a href="${data.appUrl || window.location.origin}/safety" 
           style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; margin-top: 16px;">
          View Alert
        </a>
      </div>
    `,
    
    safety_alert: `
      <div style="${baseStyle}">
        <div style="background: #f59e0b; color: white; padding: 20px; border-radius: 8px;">
          <h2 style="margin: 0;">⚠️ Safety Alert</h2>
        </div>
        <div style="padding: 20px; background: #fffbeb; margin-top: 16px; border-radius: 8px;">
          <p><strong>Type:</strong> ${data.alertType || 'Safety Notice'}</p>
          <p><strong>Location:</strong> ${data.location || 'Unknown'}</p>
          <p><strong>Description:</strong> ${data.description || 'No description provided'}</p>
        </div>
        <a href="${data.appUrl || window.location.origin}/safety" 
           style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; margin-top: 16px;">
          View Alert
        </a>
      </div>
    `,
    
    message: `
      <div style="${baseStyle}">
        <h2>💬 New Message from ${data.senderName || 'A User'}</h2>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0;">${data.messagePreview || 'You have a new message'}</p>
        </div>
        <a href="${data.appUrl || window.location.origin}/messages" 
           style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; margin-top: 16px;">
          Open in App
        </a>
      </div>
    `,
    
    community_post: `
      <div style="${baseStyle}">
        <h2>📢 New Community Post</h2>
        <p><strong>Posted by:</strong> ${data.authorName || 'A Community Member'}</p>
        <p><strong>Location:</strong> ${data.location || 'Your Community'}</p>
        <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h3>${data.title || 'Community Update'}</h3>
          <p>${data.content ? (data.content.substring(0, 300) + (data.content.length > 300 ? '...' : '')) : 'Check out this new post in your community'}</p>
        </div>
        <a href="${data.appUrl || window.location.origin}/community" 
           style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px;">
          View Full Post
        </a>
      </div>
    `,
    
    contact_request: `
      <div style="${baseStyle}">
        <h2>🤝 Emergency Contact Request</h2>
        <p><strong>From:</strong> ${data.senderName || 'A User'}</p>
        <div style="background: #eff6ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p>${data.senderName || 'Someone'} wants to add you as an emergency contact.</p>
          <p>This means they trust you to be notified in case of emergencies.</p>
        </div>
        <a href="${data.appUrl || window.location.origin}/settings" 
           style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; margin-top: 16px;">
          Respond to Request
        </a>
      </div>
    `,
    
    marketplace_update: `
      <div style="${baseStyle}">
        <h2>🛒 Marketplace Update</h2>
        <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p>${data.description || 'There\'s an update regarding your marketplace activity'}</p>
        </div>
        <a href="${data.appUrl || window.location.origin}/marketplace" 
           style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; margin-top: 16px;">
          View Marketplace
        </a>
      </div>
    `,
  };

  return templates[type] || generateGenericTemplate(data);
}

function generateGenericTemplate(data: EmailTemplateData): string {
  return `
    <div style="${baseStyle}">
      <h2>📬 Notification</h2>
      <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p>${data.description || data.content || 'You have a new notification'}</p>
      </div>
      <a href="${data.appUrl || window.location.origin}" 
         style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; 
                text-decoration: none; border-radius: 6px; margin-top: 16px;">
        Open App
      </a>
    </div>
  `;
}
