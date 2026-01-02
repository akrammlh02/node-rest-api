/**
 * Authentication and Authorization Middleware
 * Protects routes from unauthorized access
 */

/**
 * Middleware to check if user is authenticated (logged in)
 */
const isAuthenticated = (req, res, next) => {
    if (!req.session.user) {
        // Prevent caching of protected pages
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, private',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        return res.redirect('/login');
    }
    next();
};

/**
 * Middleware to check if user is authenticated (Arabic version)
 */
const isAuthenticatedAr = (req, res, next) => {
    if (!req.session.user) {
        // Prevent caching of protected pages
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, private',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        return res.redirect('/login/ar');
    }
    next();
};

/**
 * Middleware to check if user is an admin
 */
const isAdmin = (req, res, next) => {
    if (!req.session.user) {
        // Prevent caching of protected pages
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, private',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        return res.redirect('/login');
    }

    // Check if user has admin role
    if (req.session.user.role !== 'admin') {
        // Prevent caching
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, private',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        // Redirect non-admin users to their dashboard
        return res.status(403).redirect('/dashboard');
    }

    next();
};

/**
 * Middleware to check if user is an admin (Arabic version)
 */
const isAdminAr = (req, res, next) => {
    if (!req.session.user) {
        // Prevent caching of protected pages
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, private',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        return res.redirect('/login/ar');
    }

    // Check if user has admin role
    if (req.session.user.role !== 'admin') {
        // Prevent caching
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, private',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        // Redirect non-admin users to their dashboard
        return res.status(403).redirect('/dashboard/ar');
    }

    next();
};

/**
 * Middleware to check if user is a client
 */
const isClient = (req, res, next) => {
    if (!req.session.user) {
        // Prevent caching of protected pages
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, private',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        return res.redirect('/login');
    }

    // Check if user has client role
    if (req.session.user.role !== 'client') {
        // Prevent caching
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, private',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        // Redirect admin users to admin dashboard
        return res.status(403).redirect('/admin');
    }

    next();
};

/**
 * Middleware to check if user is a client (Arabic version)
 */
const isClientAr = (req, res, next) => {
    if (!req.session.user) {
        // Prevent caching of protected pages
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, private',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        return res.redirect('/login/ar');
    }

    // Check if user has client role
    if (req.session.user.role !== 'client') {
        // Prevent caching
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, private',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        // Redirect admin users to admin dashboard
        return res.status(403).redirect('/admin/ar');
    }

    next();
};

/**
 * API Middleware to check if user is authenticated
 * Returns JSON response instead of redirect
 */
const isAuthenticatedAPI = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: 'Not authenticated. Please log in.'
        });
    }
    next();
};

/**
 * API Middleware to check if user is an admin
 * Returns JSON response instead of redirect
 */
const isAdminAPI = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: 'Not authenticated. Please log in.'
        });
    }

    if (req.session.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.'
        });
    }

    next();
};

/**
 * API Middleware to check if user is a client
 * Returns JSON response instead of redirect
 */
const isClientAPI = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: 'Not authenticated. Please log in.'
        });
    }

    if (req.session.user.role !== 'client') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Client access only.'
        });
    }

    next();
};

module.exports = {
    isAuthenticated,
    isAuthenticatedAr,
    isAdmin,
    isAdminAr,
    isClient,
    isClientAr,
    isAuthenticatedAPI,
    isAdminAPI,
    isClientAPI
};
