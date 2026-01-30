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
  postId?: string;
  postTitle?: string;
  postContent?: string;
  commentContent?: string;
  commentAuthor?: string;
  replyContent?: string;
  parentCommentContent?: string;
  postAuthor?: string;
  messageContent?: string;
}

const PRIMARY_COLOR = '#0B8E67'; // Neighborlink Primary Green
const LOGO_URL = 'https://cowiviqhrnmhttugozbz.supabase.co/storage/v1/object/public/onboarding-assets/neighborlink-logo.jpeg';

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #333;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background-color: #ffffff;
`;

const headerStyle = `
  text-align: center;
  padding: 20px 0;
  border-bottom: 2px solid ${PRIMARY_COLOR};
  margin-bottom: 20px;
`;

const logoStyle = `
  max-height: 60px;
  width: auto;
`;

const buttonStyle = `
  display: inline-block; 
  background: ${PRIMARY_COLOR}; 
  color: white; 
  padding: 12px 24px; 
  text-decoration: none; 
  border-radius: 6px; 
  margin-top: 16px;
  font-weight: 500;
`;

const cardStyle = `
  padding: 20px; 
  background: #f8fafc; 
  margin-top: 16px; 
  border-radius: 8px; 
  border: 1px solid #e2e8f0;
`;

// Helper to wrap content with standard header/footer
function wrapTemplate(content: string, appUrl: string): string {
  return `
    <div style="${baseStyle}">
      <div style="${headerStyle}">
        <img src="${LOGO_URL}" alt="Neighborlink" style="${logoStyle}" />
      </div>
      ${content}
      <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #888; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} Neighborlink. All rights reserved.</p>
        <p><a href="${appUrl}" style="color: ${PRIMARY_COLOR}; text-decoration: none;">Open App</a></p>
      </div>
    </div>
  `;
}

export function generateEmailTemplate(type: string, data: EmailTemplateData): string {
  const appUrl = data.appUrl || 'https://yourapp.com';

  const templates: Record<string, string> = {
    post_comment: `
      <h2 style="color: ${PRIMARY_COLOR}; margin: 0 0 16px 0;">💬 New Comment on Your Post</h2>
      <p><strong>${data.commentAuthor || 'A community member'}</strong> commented on your post.</p>
      <div style="${cardStyle}">
        <p style="font-style: italic; color: #555; margin: 0;">
          "${data.commentContent || 'New comment'}"
        </p>
      </div>
      <div style="margin-top: 16px; font-size: 14px; color: #666;">
        <p style="margin-bottom: 4px;"><strong>On your post:</strong></p>
        <p style="color: #888; margin: 0;">${data.postContent?.substring(0, 150) || ''}${data.postContent && data.postContent.length > 150 ? '...' : ''}</p>
      </div>
      <div style="text-align: center;">
        <a href="${appUrl}/community?postId=${data.postId}" style="${buttonStyle}">
          View Comment & Reply
        </a>
      </div>
    `,

    comment_reply: `
      <h2 style="color: ${PRIMARY_COLOR}; margin: 0 0 16px 0;">💬 Reply to Your Comment</h2>
      <p><strong>${data.commentAuthor || 'A community member'}</strong> replied to you.</p>
      <div style="${cardStyle}">
        <p style="font-style: italic; color: #555; margin: 0;">
          "${data.replyContent || 'New reply'}"
        </p>
      </div>
      <div style="margin-top: 16px; font-size: 14px; color: #666;">
        <p style="margin-bottom: 4px;"><strong>Your original comment:</strong></p>
        <p style="color: #888; margin: 0;">${data.parentCommentContent?.substring(0, 150) || ''}${data.parentCommentContent && data.parentCommentContent.length > 150 ? '...' : ''}</p>
      </div>
      <div style="text-align: center;">
        <a href="${appUrl}/community?postId=${data.postId}" style="${buttonStyle}">
          View Reply
        </a>
      </div>
    `,

    post_like: `
      <h2 style="color: ${PRIMARY_COLOR}; margin: 0 0 16px 0;">❤️ New Like</h2>
      <p><strong>${data.senderName || 'Someone'}</strong> liked your post.</p>
      <div style="${cardStyle}">
        <p style="color: #555; margin: 0;">${data.postContent?.substring(0, 150) || ''}${data.postContent && data.postContent.length > 150 ? '...' : ''}</p>
      </div>
      <div style="text-align: center;">
        <a href="${appUrl}/community?postId=${data.postId}" style="${buttonStyle}">
          View Post
        </a>
      </div>
    `,

    direct_message: `
      <h2 style="color: ${PRIMARY_COLOR}; margin: 0 0 16px 0;">💬 New Message</h2>
      <p>You have a new direct message from <strong>${data.senderName || 'A User'}</strong>.</p>
      <div style="${cardStyle}">
        <p style="margin: 0; color: #333;">${data.messageContent || 'You have a new message'}</p>
      </div>
      <div style="text-align: center;">
        <a href="${appUrl}/messages" style="${buttonStyle}">
          Reply to Message
        </a>
      </div>
      <p style="margin-top: 20px; color: #999; font-size: 12px; text-align: center;">
        💡 Tip: Open the app to see the full conversation
      </p>
    `,

    emergency_alert: `
      <div style="background: #dc2626; color: white; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
        <h2 style="margin: 0;">🚨 Emergency Alert</h2>
      </div>
      <div style="${cardStyle}; border-color: #fca5a5; background: #fef2f2;">
        <p><strong>Type:</strong> ${data.alertType || 'Emergency'}</p>
        <p><strong>Location:</strong> ${data.location || 'Unknown'}</p>
        <p><strong>Description:</strong> ${data.description || 'No description provided'}</p>
        <p><strong>Time:</strong> ${data.timestamp ? new Date(data.timestamp).toLocaleString() : new Date().toLocaleString()}</p>
      </div>
      <p style="margin-top: 20px; text-align: center; font-weight: bold;">Stay safe and follow local authorities' instructions.</p>
      <div style="text-align: center;">
        <a href="${data.appUrl || window.location.origin}/safety" style="${buttonStyle}; background-color: #dc2626;">
          View Alert Details
        </a>
      </div>
    `,

    panic_alert: `
      <div style="background: #dc2626; color: white; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
        <h2 style="margin: 0;">⚠️ Panic Alert Activated</h2>
      </div>
      <div style="${cardStyle}; border-color: #fca5a5; background: #fef2f2;">
        <p style="color: #dc2626; font-weight: bold; font-size: 16px;">Someone in your area needs immediate assistance!</p>
        <p><strong>Location:</strong> ${data.location || 'Unknown'}</p>
        <p><strong>Time:</strong> ${data.timestamp ? new Date(data.timestamp).toLocaleString() : new Date().toLocaleString()}</p>
      </div>
      <div style="text-align: center;">
        <a href="${data.appUrl || window.location.origin}/safety" style="${buttonStyle}; background-color: #dc2626;">
          View Emergency Map
        </a>
      </div>
    `,

    safety_alert: `
      <div style="background: #f59e0b; color: white; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
        <h2 style="margin: 0;">⚠️ Safety Alert</h2>
      </div>
      <div style="${cardStyle}; border-color: #fcd34d; background: #fffbeb;">
        <p><strong>Type:</strong> ${data.alertType || 'Safety Notice'}</p>
        <p><strong>Location:</strong> ${data.location || 'Unknown'}</p>
        <p><strong>Description:</strong> ${data.description || 'No description provided'}</p>
      </div>
      <div style="text-align: center;">
        <a href="${data.appUrl || window.location.origin}/safety" style="${buttonStyle}; background-color: #f59e0b;">
          View Alert
        </a>
      </div>
    `,

    community_post: `
      <h2 style="color: ${PRIMARY_COLOR}; margin: 0 0 16px 0;">📢 New Community Post</h2>
      <p><strong>Posted by:</strong> ${data.authorName || 'A Community Member'}</p>
      <p><strong>Location:</strong> ${data.location || 'Your Community'}</p>
      <div style="${cardStyle}">
        <h3 style="margin-top: 0;">${data.title || 'Community Update'}</h3>
        <p style="margin-bottom: 0;">${data.content ? (data.content.substring(0, 300) + (data.content.length > 300 ? '...' : '')) : 'Check out this new post in your community'}</p>
      </div>
      <div style="text-align: center;">
        <a href="${data.appUrl || window.location.origin}/community" style="${buttonStyle}">
          View Full Post
        </a>
      </div>
    `,

    contact_request: `
      <h2 style="color: ${PRIMARY_COLOR}; margin: 0 0 16px 0;">🤝 Emergency Contact Request</h2>
      <p><strong>${data.senderName || 'Someone'}</strong> wants to add you as an emergency contact.</p>
      <div style="${cardStyle}">
        <p style="margin: 0;">This means they trust you to be notified in case of emergencies involving them.</p>
      </div>
      <div style="text-align: center;">
        <a href="${data.appUrl || window.location.origin}/settings" style="${buttonStyle}">
          Respond to Request
        </a>
      </div>
    `,

    marketplace_update: `
      <h2 style="color: ${PRIMARY_COLOR}; margin: 0 0 16px 0;">🛒 Marketplace Update</h2>
      <div style="${cardStyle}">
        <p style="margin: 0;">${data.description || 'There\'s an update regarding your marketplace activity'}</p>
      </div>
      <div style="text-align: center;">
        <a href="${data.appUrl || window.location.origin}/marketplace" style="${buttonStyle}">
          View Marketplace
        </a>
      </div>
    `,
  };

  const content = templates[type] || generateGenericTemplate(data);
  return wrapTemplate(content, appUrl);
}

function generateGenericTemplate(data: EmailTemplateData): string {
  return `
    <h2 style="color: ${PRIMARY_COLOR}; margin: 0 0 16px 0;">📬 Notification</h2>
    <div style="${cardStyle}">
      <p style="margin: 0;">${data.description || data.content || 'You have a new notification'}</p>
    </div>
    <div style="text-align: center;">
      <a href="${data.appUrl || window.location.origin}" style="${buttonStyle}">
        Open App
      </a>
    </div>
  `;
}
