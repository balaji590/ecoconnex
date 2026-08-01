# Eco Connex — Dealer WhatsApp Bulk Send Setup

## Files
- netlify/functions/dealers.mts -> GET/POST dealer list (stored in Netlify Blobs)
- netlify/functions/send-bulk-whatsapp-background.mts -> sends WhatsApp template messages to all dealers (background function, runs up to 15 min)
- netlify/functions/bulk-status.mts -> poll send progress by runId
- admin/whatsapp-bulk.html -> admin UI (add to your site, link it from /admin)

## 1. Copy into your ecoconnex project
Copy the netlify/functions/* files into your existing netlify/functions/ folder,
and admin/whatsapp-bulk.html into your existing admin/ folder.

Install the blobs package once in your project root:
    npm install @netlify/blobs @netlify/functions

## 2. Set Environment Variables (Netlify dashboard > Site configuration > Environment variables)
- ADMIN_TOKEN               -> any long random string you choose, e.g. openssl rand -hex 16
- WHATSAPP_PHONE_NUMBER_ID  -> from Meta Business Suite > WhatsApp > API Setup
- WHATSAPP_ACCESS_TOKEN     -> PERMANENT token (System User token), not the 24hr temporary one
                                Meta Business Settings > System Users > Generate Token (whatsapp_business_messaging scope)

## 3. Create & get a message template approved in Meta
Meta Business Manager > WhatsApp Manager > Message Templates > Create Template
- Category: Utility (faster approval) or Marketing
- Add variables like {{1}}, {{2}} in the body if you want dealer name / offer text inserted
- Wait for approval (usually a few hours, up to 48h)
- Use the exact template name in the admin page's Template name field

## 4. Deploy
git add . && git commit -m "Add dealer WhatsApp bulk send" && git push
(Netlify auto-deploys since it's already connected)

## 5. Use it
- Go to yoursite.com/admin/whatsapp-bulk.html
- Enter the ADMIN_TOKEN you set in step 2
- Add dealers (one by one or paste CSV: name,phone)
- Enter approved template name, toggle options, hit Send

## Notes
- Phone numbers must include country code, no + or spaces: 918778657912
- Business-initiated messages (dealer hasn't messaged you in last 24h) MUST use an approved template
- Rate limit: function waits 300ms between sends to stay safe; for 500+ dealers, let me know and I will add batching
- Dealer list and send history are stored in Netlify Blobs (free on your plan)
