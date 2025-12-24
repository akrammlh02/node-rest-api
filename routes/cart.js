const express = require('express');
const router = express.Router();
const conn = require('../config/db');

/**
 * Get cart items
 */
router.get('/', (req, res) => {
  const cart = req.session.cart || [];

  if (cart.length === 0) {
    return res.json({ success: true, cart: [], total: "0.00", itemCount: 0 });
  }

  // Get course details for cart items
  const courseIds = [...new Set(cart.map(item => Number(item.courseId)))];
  const placeholders = courseIds.map(() => '?').join(',');

  console.log(`Cart items in session:`, cart.map(item => item.courseId));

  const sql = `SELECT course_id, title, description, thumbnail_url, price, duration_hours, level 
               FROM courses 
               WHERE course_id IN (${placeholders})`;

  conn.query(sql, courseIds, (err, courses) => {
    if (err) {
      console.error('Error fetching cart courses:', err);
      return res.json({ success: false, message: 'Error fetching cart items' });
    }

    console.log(`Courses found in DB:`, courses.map(c => c.course_id));

    // Merge cart items with course details
    const cartWithDetails = cart.map(item => {
      // Ensure we compare numeric IDs correctly
      const course = courses.find(c => Number(c.course_id) === Number(item.courseId));
      return {
        courseId: item.courseId,
        quantity: item.quantity || 1,
        addedAt: item.addedAt || new Date(),
        course: course || null
      };
    }).filter(item => item.course !== null);

    // Calculate total safely - ensuring result is always a fixed decimal string
    const totalValue = cartWithDetails.reduce((sum, item) => {
      const price = parseFloat(item.course.price) || 0;
      return sum + (price * (item.quantity || 1));
    }, 0);

    res.json({
      success: true,
      cart: cartWithDetails,
      total: totalValue.toFixed(2),
      itemCount: cartWithDetails.length
    });
  });
});

/**
 * Add item to cart
 */
router.post('/add', (req, res) => {
  if (!req.session.cart) {
    req.session.cart = [];
  }

  const { courseId } = req.body;

  if (!courseId) {
    return res.json({ success: false, message: 'Course ID is required' });
  }

  // Check if course exists and user doesn't already own it
  const checkSql = 'SELECT * FROM courses WHERE course_id = ?';
  conn.query(checkSql, [courseId], (err, courses) => {
    if (err || courses.length === 0) {
      return res.json({ success: false, message: 'Course not found' });
    }

    // Check if user is logged in and already owns the course
    if (req.session.user) {
      const checkOwnershipSql = 'SELECT * FROM purchases WHERE client_id = ? AND course_id = ? AND paid = 1';
      conn.query(checkOwnershipSql, [req.session.user.id, courseId], (err, purchases) => {
        if (!err && purchases.length > 0) {
          return res.json({ success: false, message: 'You already own this course' });
        }
        addToCart();
      });
    } else {
      addToCart();
    }

    function addToCart() {
      // Check if item already in cart - Use Number() to prevent duplicates due to type mismatch
      const existingItem = req.session.cart.find(item => Number(item.courseId) === Number(courseId));

      if (existingItem) {
        return res.json({ success: false, message: 'Course already in cart' });
      }

      // Add to cart
      req.session.cart.push({
        courseId: parseInt(courseId),
        quantity: 1,
        addedAt: new Date()
      });

      res.json({
        success: true,
        message: 'Course added to cart',
        cartCount: req.session.cart.length
      });
    }
  });
});

/**
 * Remove item from cart
 */
router.post('/remove', (req, res) => {
  if (!req.session.cart) {
    req.session.cart = [];
  }

  const { courseId } = req.body;

  if (!courseId) {
    return res.json({ success: false, message: 'Course ID is required' });
  }

  const initialCount = req.session.cart.length;
  // Convert everything to numbers for safe filtering
  const idToRemove = Number(courseId);
  req.session.cart = req.session.cart.filter(item => Number(item.courseId) !== idToRemove);

  const removedCount = initialCount - req.session.cart.length;
  console.log(`[Cart Remove] ID to remove: ${idToRemove}. Before: ${initialCount}, After: ${req.session.cart.length}`);

  // Explicitly save session before responding to avoid race conditions
  req.session.save((err) => {
    if (err) {
      console.error('Session save error:', err);
      return res.json({ success: false, message: 'Session save failed' });
    }
    res.json({
      success: true,
      message: 'Course removed from cart',
      cartCount: req.session.cart.length
    });
  });
});

/**
 * Update cart item quantity (for future use, currently quantity is always 1)
 */
router.post('/update', (req, res) => {
  if (!req.session.cart) {
    req.session.cart = [];
  }

  const { courseId, quantity } = req.body;

  if (!courseId || !quantity) {
    return res.json({ success: false, message: 'Course ID and quantity are required' });
  }

  const item = req.session.cart.find(item => item.courseId === parseInt(courseId));

  if (!item) {
    return res.json({ success: false, message: 'Item not found in cart' });
  }

  item.quantity = parseInt(quantity);

  res.json({
    success: true,
    message: 'Cart updated',
    cartCount: req.session.cart.length
  });
});

/**
 * Clear cart
 */
router.post('/clear', (req, res) => {
  req.session.cart = [];
  res.json({ success: true, message: 'Cart cleared' });
});

/**
 * Get cart count (for navbar badge)
 */
router.get('/count', (req, res) => {
  const cartCount = req.session.cart ? req.session.cart.length : 0;
  res.json({ success: true, count: cartCount });
});

/**
 * Cart view page - Redirect to checkout
 */
router.get('/view', (req, res) => {
  // Redirect directly to checkout page
  res.redirect('/payment/checkout');
});

module.exports = router;

