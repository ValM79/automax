// Ported from base44/functions/contactSeller/entry.ts, extended with in-app replies.
//
// Two modes:
//  * new message (ad_id + message): from a buyer to the ad's seller.
//  * reply (ad_id + message + reply_to_message_id): from the person a message was sent
//    to, back to its original sender. The reply is stored with the *recipient* in the
//    seller_* fields (so the entity-api's existing "created_by_id or seller_user_id"
//    read rule shows it to them as a received message).
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES, newId, nowIso, json, getUserFromEvent, getSecrets, sanitize } from '../_lib/common.mjs';
import { resolveReply } from '../_lib/messaging.mjs';

export const handler = async (event) => {
  try {
    const user = await getUserFromEvent(event);
    if (!user) return json(401, { error: 'Unauthorized' });

    const body = JSON.parse(event.body || '{}');
    const { ad_id, message, reply_to_message_id } = body;
    if (!message || !ad_id) return json(400, { error: 'Missing message or ad_id' });

    const adRes = await ddb.send(new GetCommand({ TableName: TABLES.UserAd, Key: { id: ad_id } }));
    const ad = adRes.Item;
    if (!ad) return json(404, { error: 'Ad not found' });

    const verifiedAdTitle = ad.title || '';
    const cleanAdTitle = sanitize(verifiedAdTitle);
    const cleanMessage = String(message).replace(/[\r\n]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 2000);
    const cleanSenderName = sanitize(user.full_name);
    const cleanSenderEmail = String(user.email || '').replace(/[\r\n\s<>]/g, '').slice(0, 200);

    // Who receives this message.
    let recipientUserId;
    let recipientName;
    let recipientEmail;
    const isReply = !!reply_to_message_id;
    if (isReply) {
      const origRes = await ddb.send(new GetCommand({ TableName: TABLES.Message, Key: { id: String(reply_to_message_id) } }));
      const result = resolveReply(origRes.Item, user, ad_id);
      if (result.error) return json(result.status, { error: result.error });
      ({ userId: recipientUserId, name: recipientName, email: recipientEmail } = result.recipient);
    } else {
      // Contacting yourself is never useful and just creates a one-person conversation.
      if (ad.created_by_id && ad.created_by_id === user.id) {
        return json(400, { error: "You can't send a message to your own ad" });
      }
      recipientUserId = ad.created_by_id || '';
      recipientName = ad.fullName || '';
      recipientEmail = ad.email || '';
    }

    const msg = {
      id: newId(),
      ad_id,
      ad_title: verifiedAdTitle,
      seller_email: recipientEmail || '',
      seller_name: recipientName || '',
      seller_user_id: recipientUserId || '',
      sender_name: user.full_name || '',
      sender_email: user.email || '',
      message,
      status: 'sent',
      created_by_id: user.id,
      created_date: nowIso(),
      ...(isReply ? { reply_to_message_id: String(reply_to_message_id) } : {}),
    };
    await ddb.send(new PutCommand({ TableName: TABLES.Message, Item: msg }));

    let emailSent = false;
    try {
      // A new message goes to the seller's account email if they have a profile row,
      // otherwise the ad's contact email. A reply goes to the original sender's email.
      if (!isReply && recipientUserId) {
        try {
          const sellerRes = await ddb.send(new GetCommand({ TableName: TABLES.User, Key: { id: recipientUserId } }));
          if (sellerRes.Item?.email) recipientEmail = sellerRes.Item.email;
        } catch (e) {
          console.log('Could not look up seller user:', e.message);
        }
      }
      if (recipientEmail) {
        const origin = process.env.APP_ORIGIN || 'https://automax.ie';
        const cleanRecipientName = sanitize(recipientName);
        const intro = isReply
          ? `${cleanSenderName || 'A user'} (${cleanSenderEmail}) has replied to your message about "${cleanAdTitle}".`
          : `You have received a new message about your ad "${cleanAdTitle}".\n\nFrom: ${cleanSenderName || 'A user'} (${cleanSenderEmail})`;
        const { RESEND_API_KEY } = await getSecrets();
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'AutoMax <noreply@automax.ie>',
            to: recipientEmail,
            // Lets "Reply" in the user's mail app go straight to the other person
            // instead of to the no-reply sending address.
            reply_to: cleanSenderEmail || undefined,
            subject: isReply
              ? `AutoMax: Reply about "${cleanAdTitle || 'your message'}"`
              : `AutoMax: New message about "${cleanAdTitle || 'your ad'}"`,
            // The conversation key matches the one the Messages page builds for the recipient
            // (<adId>:<other person's user id>), so the link opens this exact conversation.
            text: `Hi ${cleanRecipientName || 'there'},\n\n${intro}\n\nMessage:\n${cleanMessage}\n\nView the conversation and reply in AutoMax:\n${origin}/messages?thread=${encodeURIComponent(`${ad_id}:${user.id}`)}\n\nOr simply reply to this email to answer ${cleanSenderName || 'them'} directly.`,
          }),
        });
        emailSent = resendRes.ok;
        if (!resendRes.ok) console.error('Message notification email failed:', resendRes.status, await resendRes.text());
        // The Resend id lets a missing email be traced in the Resend dashboard (Emails > search by id).
        else console.log('Message notification email accepted by Resend:', JSON.stringify({ ...(await resendRes.json().catch(() => ({}))), to: recipientEmail }));
      }
    } catch (emailErr) {
      console.log('Email sending skipped:', emailErr.message);
    }

    return json(200, { success: true, message: msg, email_sent: emailSent });
  } catch (error) {
    console.error('contactSeller error:', error);
    return json(500, { error: error.message });
  }
};
