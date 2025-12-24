const express = require('express');
const router = express.Router();
const multer = require('multer');
const bcrypt = require('bcrypt');
const conn = require('../config/db');
const cloudinary = require('cloudinary').v2;
const crypto = require('crypto');
const axios = require('axios');

// --- Configuration ---
const SLICKPAY_PUBLIC_KEY = process.env.SLICKPAY_PUBLIC_KEY;
const SLICKPAY_SANDBOX = process.env.SLICKPAY_MODE !== 'production';

// --- Multer Setup ---
const proofStorage = multer.memoryStorage();
const uploadProof = multer({
  storage: proofStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed!'), false);
    }
  }
});

// --- Helper Functions ---

function generatePaymentReference() {
  return 'PAY-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

const isPaymentSuccessful = (status) => {
  if (!status) return false;
  const s = status.toLowerCase();
  return ['completed', 'paid', 'accomplie', 'success'].includes(s);
};

// Activate Membership for a client
async function activateMembership(payment) {
  const plan = payment.membership_plan;
  const tier = plan === 'vip' ? 'VIP' : 'Pro';
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 30); // 30 days validation

  const sql = `
    UPDATE client 
    SET membership_tier = ?, membership_expiry = ?, membership_status = 'active' 
    WHERE id = ?
  `;
  try {
    await conn.promise().query(sql, [tier, expiryDate, payment.client_id]);
    return true;
  } catch (err) {
    console.error('Error activating membership:', err);
    return false;
  }
}

// Grant access to courses for a payment
async function grantCourseAccess(payment) {
  // Check if there are related payments (aggregated cart payment)
  const [relatedPayments] = await conn.promise().query(
    'SELECT * FROM payments WHERE transaction_id = ?',
    [payment.transaction_id]
  );

  const paymentsToProcess = (relatedPayments && relatedPayments.length > 0) ? relatedPayments : [payment];

  for (const p of paymentsToProcess) {
    if (p.payment_type === 'membership') continue; // Skip membership items in mixed cart (shouldn't happen usually)

    const [existing] = await conn.promise().query(
      'SELECT * FROM purchases WHERE client_id = ? AND course_id = ?',
      [p.client_id, p.course_id]
    );

    if (existing.length > 0) {
      await conn.promise().query(
        'UPDATE purchases SET paid = 1 WHERE client_id = ? AND course_id = ?',
        [p.client_id, p.course_id]
      );
    } else {
      await conn.promise().query(
        'INSERT INTO purchases (client_id, course_id, purchase_date, paid) VALUES (?, ?, NOW(), 1)',
        [p.client_id, p.course_id]
      );
    }
  }
}

/**
 * Create Slick Pay Payment (Contact + Invoice)
 */
async function createSlickPayPayment(amount, method, clientId, courseId, paymentId, customerInfo = {}, items = []) {
  try {
    const domain = process.env.SLICKPAY_MODE === 'production' ? 'prodapi.slick-pay.com' : 'devapi.slick-pay.com';
    const baseUrl = `https://${domain}/api/v2`;

    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SLICKPAY_PUBLIC_KEY}`
    };

    const nameParts = (customerInfo.name || 'Student Client').trim().split(' ');
    const firstname = nameParts[0] || 'Student';
    const lastname = nameParts.slice(1).join(' ') || 'Client';

    const redirectUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/payment/callback`;

    // Ensure items exist
    let invoiceItems = items;
    if (!invoiceItems || invoiceItems.length === 0) {
      invoiceItems = [{
        name: customerInfo.itemName || 'Course Access',
        price: parseFloat(amount),
        quantity: 1
      }];
    }

    // 1. Create Contact
    // RIB must be unique. Format: 00799 + timestamp + random
    const mockRib = '00799' + Date.now().toString() + Math.floor(Math.random() * 100).toString().padStart(2, '0');

    const contactPayload = {
      firstname,
      lastname,
      email: customerInfo.email || 'student@devacademy.dz',
      phone: customerInfo.phone || '0555555555',
      address: 'Algeria',
      rib: mockRib
    };

    let contactId;
    try {
      const contactResponse = await axios.post(`${baseUrl}/users/contacts`, contactPayload, { headers });
      const respData = contactResponse.data;
      contactId = respData.uuid || (respData.data && respData.data.uuid) || respData.id;
    } catch (contactError) {
      throw new Error('Failed to create SlickPay contact: ' + (contactError.response?.data?.message || contactError.message));
    }

    if (!contactId) throw new Error('Failed to retrieve Contact ID from SlickPay response.');

    // 2. Create Invoice
    const invoicePayload = {
      amount: parseFloat(amount),
      contact: contactId,
      url: redirectUrl,
      return_url: redirectUrl,
      items: invoiceItems,
      note: `Payment for Order #${paymentId}`
    };

    const response = await axios.post(`${baseUrl}/users/invoices`, invoicePayload, { headers });

    if (response.data && response.data.success) {
      return {
        success: true,
        id: response.data.id,
        url: response.data.url,
        uuid: response.data.uuid
      };
    } else {
      throw new Error((response.data && response.data.message) || 'Failed to create invoice');
    }
  } catch (error) {
    let errorMsg = error.message || 'Unknown error';
    if (error.response && error.response.data) {
      errorMsg = error.response.data.message || errorMsg;
      if (error.response.data.errors) {
        errorMsg += ': ' + Object.values(error.response.data.errors).flat().join(', ');
      }
    }
    throw new Error(errorMsg);
  }
}

// --- Routes ---

/**
 * Cart Checkout Page
 */
router.get('/checkout', (req, res) => {
  const plan = req.query.plan;

  // Membership Checkout View
  if (plan === 'monthly' || plan === 'vip') {
    const planInfo = {
      id: plan,
      name: plan === 'monthly' ? 'Pro Member' : 'VIP Elite',
      price: plan === 'monthly' ? 1100 : 2100,
      description: plan === 'monthly' ? 'Monthly Pro Membership' : 'Monthly VIP Membership'
    };

    return res.render('checkout', {
      isLoggedIn: !!req.session.user,
      user: req.session.user || null,
      isMembership: true,
      membershipPlan: planInfo,
      total: planInfo.price.toFixed(2),
      itemCount: 1
    });
  }

  // Course Cart Checkout View
  const cart = req.session.cart || [];
  if (cart.length === 0) {
    return res.render('checkout', {
      isLoggedIn: !!req.session.user,
      user: req.session.user || null,
      cart: [],
      total: "0.00",
      itemCount: 0
    });
  }

  const courseIds = cart.map(item => item.courseId);
  const placeholders = courseIds.map(() => '?').join(',');
  const sql = `SELECT course_id, title, thumbnail_url, price, level, duration_hours FROM courses WHERE course_id IN (${placeholders})`;

  conn.query(sql, courseIds, (err, courses) => {
    if (err) {
      console.error('Error fetching courses:', err);
      return res.redirect('/course');
    }

    const cartWithDetails = cart.map(item => {
      const course = courses.find(c => c.course_id === item.courseId);
      return { ...item, course };
    }).filter(item => item.course);

    const total = cartWithDetails.reduce((sum, item) => sum + parseFloat(item.course.price), 0);

    res.render('checkout', {
      isLoggedIn: !!req.session.user,
      user: req.session.user || null,
      cart: cartWithDetails,
      total: total.toFixed(2),
      itemCount: cartWithDetails.length
    });
  });
});

/**
 * Process Checkout
 */
router.post('/checkout', async (req, res) => {
  const { paymentMethod, billingName, billingEmail, billingPhone, password, isMembership, membershipPlanId } = req.body;

  if (!isMembership) {
    const cart = req.session.cart || [];
    if (cart.length === 0) return res.json({ success: false, message: 'Cart is empty' });
  }

  const validMethods = ['slickpay', 'flexy', 'ccp_baridimob', 'whatsapp', 'slickpay_edahabia', 'slickpay_cib', 'ccp', 'baridimob'];
  if (!paymentMethod || !validMethods.includes(paymentMethod)) {
    return res.json({ success: false, message: 'Invalid payment method' });
  }

  try {
    await ensureUserSession(req, { billingName, billingEmail, billingPhone, password });

    if (isMembership) {
      return handleMembershipCheckout(req, res, paymentMethod, membershipPlanId);
    }
    return handleCartCheckout(req, res, paymentMethod);
  } catch (error) {
    console.error('Checkout error:', error);
    return res.json({ success: false, message: error.message || 'Checkout failed' });
  }
});

/**
 * Create Single Course Payment (Legacy/Direct)
 */
router.post('/create', async (req, res) => {
  if (!req.session.user) return res.json({ success: false, message: 'Please log in to make a payment' });

  const { courseId, amount, paymentMethod, cartCheckout } = req.body;
  const clientId = req.session.user.id;

  if (cartCheckout && req.session.cart && req.session.cart.length > 0) {
    return handleCartCheckout(req, res, paymentMethod);
  }

  if (!courseId || !amount || !paymentMethod) return res.json({ success: false, message: 'Missing required fields' });

  // Check if course exists
  try {
    const [courses] = await conn.promise().query('SELECT * FROM courses WHERE course_id = ?', [courseId]);
    if (courses.length === 0) return res.json({ success: false, message: 'Course not found' });
    const course = courses[0];

    // Check purchase
    const [purchases] = await conn.promise().query('SELECT * FROM purchases WHERE client_id = ? AND course_id = ? AND paid = 1', [clientId, courseId]);
    if (purchases.length > 0) return res.json({ success: false, message: 'You already have access to this course' });

    // Create Payment
    const paymentReference = generatePaymentReference();
    const insertSql = `INSERT INTO payments (client_id, course_id, amount, payment_method, status, payment_reference) VALUES (?, ?, ?, ?, 'pending', ?)`;
    const [result] = await conn.promise().query(insertSql, [clientId, courseId, amount, paymentMethod, paymentReference]);
    const paymentId = result.insertId;

    if (paymentMethod === 'slickpay' || paymentMethod.startsWith('slickpay_')) {
      // Online Payment
      try {
        const methodType = paymentMethod === 'slickpay' ? 'slickpay_edahabia' : paymentMethod;
        const user = req.session.user;

        const slickPayResult = await createSlickPayPayment(
          amount,
          methodType,
          clientId,
          courseId,
          paymentId,
          {
            name: user.fullName || user.username,
            email: user.email,
            phone: user.phone || '',
            itemName: course.title
          },
          [{ name: course.title, price: parseFloat(amount), quantity: 1 }]
        );

        await conn.promise().query('UPDATE payments SET transaction_id = ? WHERE id = ?', [String(slickPayResult.id), paymentId]);

        res.json({
          success: true,
          paymentId,
          paymentMethod: paymentMethod === 'slickpay' ? 'slickpay' : paymentMethod,
          redirectUrl: slickPayResult.url,
          transactionId: slickPayResult.id
        });
      } catch (error) {
        console.error('Slick Pay error:', error);
        res.json({ success: false, message: 'Failed to initialize online payment. Please try manual payment methods.', paymentId, fallback: true });
      }
    } else {
      // Manual Payment Info
      let infoSql = 'SELECT * FROM payment_info WHERE method = ? AND is_active = 1';
      let params = [paymentMethod];

      if (paymentMethod === 'ccp_baridimob') {
        infoSql = 'SELECT * FROM payment_info WHERE method IN (?, ?) AND is_active = 1 ORDER BY method LIMIT 1';
        params = ['ccp', 'baridimob'];
      }

      const [infos] = await conn.promise().query(infoSql, params);
      const paymentInfo = infos[0] || { method: paymentMethod, message: 'Manual payment' };

      res.json({ success: true, paymentId, paymentMethod, paymentInfo });
    }
  } catch (err) {
    console.error('Create payment error:', err);
    res.json({ success: false, message: 'Internal error' });
  }
});

/**
 * Upload Payment Proof
 */
router.post('/upload-proof', uploadProof.single('proof'), async (req, res) => {
  if (!req.session.user) return res.json({ success: false, message: 'Unauthorized' });

  const { paymentId, proofType, referenceNumber } = req.body;
  if (!paymentId || !req.file) return res.json({ success: false, message: 'Payment ID and proof file required' });

  try {
    const [payments] = await conn.promise().query('SELECT * FROM payments WHERE id = ? AND client_id = ?', [paymentId, req.session.user.id]);
    if (payments.length === 0) return res.json({ success: false, message: 'Payment not found' });
    const payment = payments[0];

    // Cloudinary Upload
    const base64File = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const uploadResult = await cloudinary.uploader.upload(base64File, {
      folder: 'devacademy/payment-proofs',
      resource_type: 'auto'
    });

    if (referenceNumber && payment.payment_method !== 'whatsapp') {
      await conn.promise().query('UPDATE payments SET payment_reference = ? WHERE id = ?', [referenceNumber, paymentId]);
    }

    await conn.promise().query(
      'INSERT INTO payment_proofs (payment_id, proof_type, file_url) VALUES (?, ?, ?)',
      [paymentId, proofType || 'screenshot', uploadResult.secure_url]
    );

    res.json({
      success: true,
      message: 'Proof uploaded successfully. We will verify your payment soon.',
      proofUrl: uploadResult.secure_url
    });
  } catch (err) {
    console.error('Proof upload error:', err);
    res.json({ success: false, message: 'Failed to upload proof' });
  }
});

/**
 * SlickPay Callback (GET) - User Return
 */
router.get('/callback', async (req, res) => {
  try {
    const invoiceId = req.query.id || req.query.invoice_id;
    if (!invoiceId) return res.redirect('/course');

    // 1. Verify with SlickPay API
    const domain = process.env.SLICKPAY_MODE === 'production' ? 'prodapi.slick-pay.com' : 'devapi.slick-pay.com';
    const verifyResponse = await axios.get(`https://${domain}/api/v2/users/invoices/${invoiceId}`, {
      headers: { 'Authorization': `Bearer ${SLICKPAY_PUBLIC_KEY}`, 'Accept': 'application/json' }
    });
    const invoiceData = verifyResponse.data.data || verifyResponse.data;

    // 2. Process if successful
    if (isPaymentSuccessful(invoiceData.status)) {
      const [payments] = await conn.promise().query('SELECT * FROM payments WHERE transaction_id = ? LIMIT 1', [String(invoiceId)]);
      if (payments.length === 0) return res.redirect('/course?payment=not_found');

      const payment = payments[0];
      if (payment.status !== 'completed') {
        // Update status
        await conn.promise().query('UPDATE payments SET status = ?, completed_at = NOW() WHERE id = ?', ['completed', payment.id]);

        // Grant Access
        if (payment.payment_type === 'membership') {
          await activateMembership(payment);
        } else {
          await grantCourseAccess(payment);
        }
      }

      // Success Redirect
      if (req.session.cart) req.session.cart = [];
      if (payment.payment_type === 'membership') {
        return res.redirect('/payment/success?type=membership');
      }
      return res.redirect('/payment/success');
    }

    // Not successful
    res.redirect('/course?payment=processing');

  } catch (error) {
    console.error('Callback error:', error.message);
    res.redirect('/course?payment=error');
  }
});

/**
 * SlickPay Webhook (POST)
 */
router.post('/callback', async (req, res) => {
  const { id, status, order_id } = req.body;
  const transaction_id = id || req.body.transaction_id;

  if (!transaction_id) return res.status(400).json({ success: false, message: 'Invalid callback' });

  try {
    const [payments] = await conn.promise().query('SELECT * FROM payments WHERE id = ? OR transaction_id = ? LIMIT 1', [order_id || 0, String(transaction_id)]);
    if (payments.length === 0) return res.status(404).json({ success: false, message: 'Payment not found' });

    const payment = payments[0];
    const isSuccess = isPaymentSuccessful(status);

    // Update status
    await conn.promise().query(
      'UPDATE payments SET status = ?, transaction_id = ?, completed_at = NOW() WHERE id = ?',
      [isSuccess ? 'completed' : 'failed', transaction_id, payment.id]
    );

    if (isSuccess) {
      if (payment.payment_type === 'membership') {
        await activateMembership(payment);
      } else {
        await grantCourseAccess(payment);
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ success: false });
  }
});

/**
 * Success Page
 */
router.get('/success', (req, res) => {
  if (req.session.cart) req.session.cart = [];
  res.render('payment-success', {
    isLoggedIn: !!req.session.user,
    user: req.session.user || null,
    isMembership: req.query.type === 'membership'
  });
});

/**
 * Cancel Page
 */
router.get('/cancel', (req, res) => {
  res.render('payment-cancel', {
    isLoggedIn: !!req.session.user,
    user: req.session.user || null
  });
});

/**
 * Get Payment Status
 */
router.get('/status/:paymentId', async (req, res) => {
  if (!req.session.user) return res.json({ success: false, message: 'Unauthorized' });
  const paymentId = req.params.paymentId;

  try {
    const sql = `
      SELECT p.*, c.title as course_title, c.thumbnail_url
      FROM payments p
      INNER JOIN courses c ON p.course_id = c.course_id
      WHERE p.id = ? AND p.client_id = ?
    `;
    const [payments] = await conn.promise().query(sql, [paymentId, req.session.user.id]);
    if (payments.length === 0) return res.json({ success: false, message: 'Payment not found' });

    const [proofs] = await conn.promise().query('SELECT * FROM payment_proofs WHERE payment_id = ?', [paymentId]);

    res.json({
      success: true,
      payment: { ...payments[0], proofs: proofs || [] }
    });
  } catch (err) {
    console.error('Status error:', err);
    res.json({ success: false, message: 'Error fetching status' });
  }
});

/**
 * Get Payment Method Info
 */
router.get('/info/:method', async (req, res) => {
  const method = req.params.method;
  let sql = 'SELECT * FROM payment_info WHERE method = ? AND is_active = 1';
  let params = [method];

  if (method === 'ccp_baridimob') {
    sql = 'SELECT * FROM payment_info WHERE method IN (?, ?) AND is_active = 1 ORDER BY method LIMIT 1';
    params = ['ccp', 'baridimob'];
  }

  try {
    const [infos] = await conn.promise().query(sql, params);
    if (infos.length === 0) return res.json({ success: false, message: 'Method not found' });

    const paymentInfo = infos[0];
    if (paymentInfo.contact_info) {
      try { paymentInfo.contact_info = JSON.parse(paymentInfo.contact_info); } catch (e) { paymentInfo.contact_info = {}; }
    }
    res.json({ success: true, paymentInfo });
  } catch (err) {
    res.json({ success: false, message: 'Error' });
  }
});


// --- Internal Logic Handlers ---

async function handleCartCheckout(req, res, paymentMethod) {
  try {
    const cart = req.session.cart || [];
    const clientId = req.session.user.id;
    const user = req.session.user;

    // Fetch courses
    const courseIds = cart.map(item => item.courseId);
    if (courseIds.length === 0) return res.json({ success: false, message: 'Cart empty' });

    const placeholders = courseIds.map(() => '?').join(',');
    const [courses] = await conn.promise().query(`SELECT course_id, title, price FROM courses WHERE course_id IN (${placeholders})`, courseIds);

    const total = courses.reduce((sum, c) => sum + parseFloat(c.price), 0);
    const totalFormatted = total.toFixed(2);

    // Create Payments
    const payments = [];
    for (const item of cart) {
      const course = courses.find(c => String(c.course_id) === String(item.courseId));
      if (!course) continue;

      const ref = generatePaymentReference();
      const [res] = await conn.promise().query(
        'INSERT INTO payments (client_id, course_id, amount, payment_method, status, payment_reference) VALUES (?, ?, ?, ?, "pending", ?)',
        [clientId, course.course_id, course.price, paymentMethod, ref]
      );
      payments.push({ paymentId: res.insertId, courseId: course.course_id, amount: course.price });
    }

    if (payments.length === 0) return res.json({ success: false, message: 'Error creating payments' });

    // Online Handling
    if (paymentMethod === 'slickpay' || paymentMethod.startsWith('slickpay_')) {
      const firstId = payments[0].paymentId;
      const slickPayResult = await createSlickPayPayment(
        totalFormatted,
        paymentMethod,
        clientId,
        0,
        firstId,
        { name: user.fullName || user.username, email: user.email, phone: user.phone },
        courses.map(c => ({ name: c.title, price: parseFloat(c.price), quantity: 1 }))
      );

      // Update Transaction ID for ALL payments
      const ids = payments.map(p => p.paymentId);
      await conn.promise().query('UPDATE payments SET transaction_id = ? WHERE id IN (?)', [String(slickPayResult.id), ids]);

      return res.json({
        success: true,
        message: 'Proceeding...',
        total: totalFormatted,
        redirectUrl: slickPayResult.url,
        redirectToPayment: true
      });
    }

    // Manual Handling
    let infoSql = 'SELECT * FROM payment_info WHERE method = ? AND is_active = 1';
    let params = [paymentMethod];
    if (paymentMethod === 'ccp_baridimob') {
      infoSql = 'SELECT * FROM payment_info WHERE method IN (?, ?) AND is_active = 1 ORDER BY method LIMIT 1';
      params = ['ccp', 'baridimob'];
    }
    const [infos] = await conn.promise().query(infoSql, params);
    let pInfo = infos[0];
    if (pInfo && pInfo.contact_info) {
      try { pInfo.contact_info = JSON.parse(pInfo.contact_info); } catch (e) { }
    }

    return res.json({
      success: true,
      payments,
      total: totalFormatted,
      paymentInfo: pInfo,
      message: 'Payments created.'
    });

  } catch (error) {
    console.error('Cart checkout error:', error);
    return res.json({ success: false, message: 'Failed to create payments' });
  }
}

async function handleMembershipCheckout(req, res, paymentMethod, planId) {
  try {
    const clientId = req.session.user.id;
    const user = req.session.user;
    const planPrice = planId === 'vip' ? 2100 : 1100;
    const planName = planId === 'vip' ? 'VIP Elite' : 'Pro Member';
    const ref = generatePaymentReference();

    const [result] = await conn.promise().query(
      'INSERT INTO payments (client_id, course_id, amount, payment_method, status, payment_reference, payment_type, membership_plan) VALUES (?, 0, ?, ?, "pending", ?, "membership", ?)',
      [clientId, planPrice, paymentMethod, ref, planId]
    );
    const paymentId = result.insertId;

    if (paymentMethod === 'slickpay' || paymentMethod.startsWith('slickpay_')) {
      const slickPayResult = await createSlickPayPayment(
        planPrice,
        paymentMethod,
        clientId,
        0,
        paymentId,
        { name: user.fullName || user.username, email: user.email, phone: user.phone, itemName: planName },
        [{ name: planName, price: parseFloat(planPrice), quantity: 1 }]
      );

      await conn.promise().query('UPDATE payments SET transaction_id = ? WHERE id = ?', [String(slickPayResult.id), paymentId]);

      return res.json({
        success: true,
        redirectUrl: slickPayResult.url,
        redirectToPayment: true
      });
    }

    // Manual...
    return res.json({ success: true, payments: [{ paymentId }], message: 'Membership request created.' });

  } catch (error) {
    console.error('Membership error:', error);
    res.json({ success: false, message: 'Error' });
  }
}

function ensureUserSession(req, billing) {
  return new Promise((resolve, reject) => {
    if (req.session.user) return resolve();
    const { billingName, billingEmail, billingPhone, password } = billing || {};
    if (!billingName || !billingEmail || !password) return reject(new Error('Fill all fields'));

    conn.query('SELECT * FROM client WHERE email = ?', [billingEmail], async (err, rows) => {
      if (err) return reject(new Error('DB error'));
      if (rows.length > 0) {
        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) return reject(new Error('Wrong password for existing email'));
        req.session.user = { id: user.id, fullName: user.fullname, email: user.email, phone: user.phone };
        resolve();
      } else {
        const hashed = await bcrypt.hash(password, 10);
        conn.query('INSERT INTO client (fullname, email, password, phone) VALUES (?, ?, ?, ?)', [billingName, billingEmail, hashed, billingPhone], (err, res) => {
          if (err) return reject(new Error('Create error'));
          req.session.user = { id: res.insertId, fullName: billingName, email: billingEmail, phone: billingPhone };
          resolve();
        });
      }
    });
  });
}

module.exports = router;
