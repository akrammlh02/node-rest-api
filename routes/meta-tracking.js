const express = require('express');
const router = express.Router();
const https = require('https');

// Meta Pixel ID and Access Token (you'll need to get this from Meta)
const PIXEL_ID = '1567430537783358';
const ACCESS_TOKEN = process.env.META_CAPI_TOKEN; // Add this to your .env file

/**
 * Server-side Meta Pixel tracking using Conversions API
 * This bypasses ad blockers and privacy settings on mobile
 */
function trackMetaEvent(eventName, eventData, userData) {
    if (!ACCESS_TOKEN) {
        console.error('[META CAPI] Access token not configured');
        return;
    }

    const eventTime = Math.floor(Date.now() / 1000);

    const payload = {
        data: [{
            event_name: eventName,
            event_time: eventTime,
            action_source: 'website',
            event_source_url: eventData.event_source_url,
            user_data: {
                client_ip_address: userData.ip,
                client_user_agent: userData.userAgent,
                fbc: userData.fbc, // Facebook click ID from cookie
                fbp: userData.fbp  // Facebook browser ID from cookie
            },
            custom_data: eventData.custom_data || {}
        }]
    };

    const data = JSON.stringify(payload);

    const options = {
        hostname: 'graph.facebook.com',
        port: 443,
        path: `/v18.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
            responseData += chunk;
        });

        res.on('end', () => {
            console.log(`[META CAPI] ${eventName} event sent:`, responseData);
        });
    });

    req.on('error', (error) => {
        console.error(`[META CAPI] Error sending ${eventName}:`, error);
    });

    req.write(data);
    req.end();
}

/**
 * Track PageView event (server-side)
 */
router.post('/track/pageview', (req, res) => {
    const { url, fbc, fbp } = req.body;

    const userData = {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        fbc: fbc,
        fbp: fbp
    };

    const eventData = {
        event_source_url: url,
        custom_data: {}
    };

    trackMetaEvent('PageView', eventData, userData);

    res.json({ success: true, message: 'PageView tracked' });
});

/**
 * Track Lead event (server-side)
 */
router.post('/track/lead', (req, res) => {
    const { url, courseName, coursePrice, courseId, fbc, fbp } = req.body;

    const userData = {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        fbc: fbc,
        fbp: fbp
    };

    const eventData = {
        event_source_url: url,
        custom_data: {
            content_name: courseName,
            content_category: 'Course',
            content_ids: [courseId],
            value: parseFloat(coursePrice) || 0,
            currency: 'DZD'
        }
    };

    trackMetaEvent('Lead', eventData, userData);

    res.json({ success: true, message: 'Lead tracked' });
});

module.exports = router;
