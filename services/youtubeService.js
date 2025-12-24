const { google } = require('googleapis');
const stream = require('stream');

/**
 * YouTube Service for handling OAuth and video uploads
 */
const youtubeService = {
    /**
     * Get the OAuth2 client
     * @param {string} redirectUri 
     * @returns {object} OAuth2 client
     */
    getOAuth2Client: (redirectUri) => {
        return new google.auth.OAuth2(
            process.env.YOUTUBE_CLIENT_ID,
            process.env.YOUTUBE_CLIENT_SECRET,
            redirectUri
        );
    },

    /**
     * Generate the auth URL for YouTube
     * @param {string} redirectUri 
     * @returns {string} Auth URL
     */
    getAuthUrl: (redirectUri) => {
        const oauth2Client = youtubeService.getOAuth2Client(redirectUri);
        const scopes = [
            'https://www.googleapis.com/auth/youtube.upload',
            'https://www.googleapis.com/auth/youtube.readonly'
        ];

        return oauth2Client.generateAuthUrl({
            access_type: 'offline', // Important for getting a refresh token
            scope: scopes,
            prompt: 'consent' // Forces showing the consent screen to ensure refresh token is provided
        });
    },

    /**
     * Exchange auth code for tokens
     * @param {string} code 
     * @param {string} redirectUri 
     * @returns {Promise<object>} Tokens
     */
    getTokensFromCode: async (code, redirectUri) => {
        const oauth2Client = youtubeService.getOAuth2Client(redirectUri);
        const { tokens } = await oauth2Client.getToken(code);
        return tokens;
    },

    /**
     * Refresh an expired access token
     * @param {string} refreshToken 
     * @returns {Promise<string>} New access token
     */
    refreshAccessToken: async (refreshToken) => {
        const oauth2Client = new google.auth.OAuth2(
            process.env.YOUTUBE_CLIENT_ID,
            process.env.YOUTUBE_CLIENT_SECRET
        );
        oauth2Client.setCredentials({ refresh_token: refreshToken });
        const { credentials } = await oauth2Client.refreshAccessToken();
        return credentials.access_token;
    },

    /**
     * Upload a video to YouTube
     * @param {Buffer} videoBuffer 
     * @param {string} title 
     * @param {string} description 
     * @param {string} accessToken 
     * @returns {Promise<object>} Upload result
     */
    uploadVideoToYouTube: async (videoBuffer, title, description, accessToken) => {
        const oauth2Client = new google.auth.OAuth2(
            process.env.YOUTUBE_CLIENT_ID,
            process.env.YOUTUBE_CLIENT_SECRET
        );
        oauth2Client.setCredentials({ access_token: accessToken });

        const youtube = google.youtube({
            version: 'v3',
            auth: oauth2Client,
        });

        // Convert buffer to stream
        const bufferStream = new stream.PassThrough();
        bufferStream.end(videoBuffer);

        const response = await youtube.videos.insert({
            part: 'snippet,status',
            requestBody: {
                snippet: {
                    title: title,
                    description: description,
                    categoryId: '27', // Education category
                    tags: ['DevAcademy', 'Programming', 'Course'],
                },
                status: {
                    privacyStatus: 'unlisted', // Default to unlisted for course videos
                    selfDeclaredMadeForKids: false,
                },
            },
            media: {
                body: bufferStream,
            },
        });

        const videoId = response.data.id;
        return {
            videoId: videoId,
            embedUrl: `https://www.youtube.com/embed/${videoId}`,
            watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
            status: response.data.status
        };
    }
};

module.exports = youtubeService;
