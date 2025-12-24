// Payment System JavaScript

let currentPaymentId = null;
let currentCourseId = null;
let currentAmount = 0;
let selectedPaymentMethod = null;

/**
 * Open payment modal
 */
function openPaymentModal(courseId, courseTitle, courseImage, amount) {
  currentCourseId = courseId;
  currentAmount = amount;

  // Set modal content
  document.getElementById('paymentCourseTitle').textContent = courseTitle;
  document.getElementById('paymentCourseId').textContent = courseId;
  document.getElementById('paymentAmount').textContent = amount + ' DA';
  document.getElementById('paymentCourseImage').src = courseImage || '/images/logo.png';

  // Reset form
  document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
    radio.checked = false;
  });
  selectedPaymentMethod = null;
  document.getElementById('proceedPaymentBtn').disabled = true;
  document.getElementById('paymentInfoDisplay').style.display = 'none';
  document.getElementById('proofUploadSection').style.display = 'none';
  document.getElementById('paymentError').style.display = 'none';
  document.getElementById('paymentLoading').style.display = 'none';
  document.getElementById('proofFile').value = '';
  document.getElementById('paymentReference').value = '';
  document.getElementById('proofPreview').style.display = 'none';

  // Show modal
  const modal = new bootstrap.Modal(document.getElementById('paymentModal'));
  modal.show();
}

/**
 * Select payment method
 */
function selectPaymentMethod(method) {
  selectedPaymentMethod = method;

  // Update radio button
  const radioId = method;
  const radioElement = document.getElementById(`method_${radioId}`);
  if (radioElement) {
    radioElement.checked = true;
  }

  // Enable proceed button
  document.getElementById('proceedPaymentBtn').disabled = false;

  // Show payment info for manual methods
  if (method === 'ccp_baridimob' || method === 'whatsapp') {
    // For combined ccp_baridimob, we can load ccp info (or create a combined one)
    loadPaymentInfo(method);
  } else {
    document.getElementById('paymentInfoDisplay').style.display = 'none';
    document.getElementById('proofUploadSection').style.display = 'none';
  }
}

/**
 * Load payment information for manual methods
 */
async function loadPaymentInfo(method) {
  try {
    const response = await fetch(`/payment/info/${method}`);
    const result = await response.json();

    if (result.success) {
      const info = result.paymentInfo;
      document.getElementById('paymentInfoTitle').textContent = info.title;
      document.getElementById('paymentInfoText').textContent = info.info_text;

      // Display contact info
      const detailsDiv = document.getElementById('paymentInfoDetails');
      if (info.contact_info) {
        let detailsHTML = '<div class="mt-2"><strong>Payment Details:</strong><ul class="mb-0 mt-2">';

        if (info.contact_info.account_number) {
          detailsHTML += `<li>Account Number: <strong>${info.contact_info.account_number}</strong></li>`;
        }
        if (info.contact_info.account_name) {
          detailsHTML += `<li>Account Name: <strong>${info.contact_info.account_name}</strong></li>`;
        }
        if (info.contact_info.phone) {
          detailsHTML += `<li>Phone: <strong>${info.contact_info.phone}</strong></li>`;
        }

        detailsHTML += '</ul></div>';
        detailsDiv.innerHTML = detailsHTML;
      }

      document.getElementById('paymentInfoDisplay').style.display = 'block';

      // Show proof upload for CCP/Baridimob combined
      if (method === 'ccp' || method === 'ccp_baridimob') {
        document.getElementById('proofUploadSection').style.display = 'block';
      } else if (method === 'whatsapp') {
        document.getElementById('proofUploadSection').style.display = 'none';
      }
    }
  } catch (error) {
    console.error('Error loading payment info:', error);
  }
}

/**
 * Proceed to payment
 */
async function proceedToPayment() {
  if (!selectedPaymentMethod) {
    alert('Please select a payment method');
    return;
  }

  if (!req.session || !req.session.user) {
    alert('Please log in to make a payment');
    window.location.href = '/login';
    return;
  }

  // Show loading
  document.getElementById('paymentLoading').style.display = 'block';
  document.getElementById('paymentError').style.display = 'none';
  document.getElementById('proceedPaymentBtn').disabled = true;

  try {
    const response = await fetch('/payment/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        courseId: currentCourseId,
        amount: currentAmount,
        paymentMethod: selectedPaymentMethod
      })
    });

    const result = await response.json();

    if (result.success) {
      currentPaymentId = result.paymentId;

      // Handle online payments (redirect)
      if (selectedPaymentMethod.startsWith('slickpay_') && result.redirectUrl) {
        window.location.href = result.redirectUrl;
        return;
      }

      // Manual payments - show success message
      if (selectedPaymentMethod === 'whatsapp') {
        const info = result.paymentInfo;
        const phone = (info && info.contact_info && info.contact_info.phone) || '213540921726';
        const message = encodeURIComponent((info && info.contact_info && info.contact_info.message) || `Hello, I want to pay for course ID: ${currentCourseId}, Payment ID: ${currentPaymentId}`);
        window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');

        alert('Payment created! Please contact us via WhatsApp to complete your payment.');
        bootstrap.Modal.getInstance(document.getElementById('paymentModal')).hide();
        location.reload();
      } else {
        // Show proof upload section if not already shown
        document.getElementById('proofUploadSection').style.display = 'block';
        document.getElementById('paymentLoading').style.display = 'none';
        alert('Payment created! Please upload your payment proof.');
      }
    } else {
      throw new Error(result.message || 'Failed to create payment');
    }
  } catch (error) {
    console.error('Payment error:', error);
    document.getElementById('paymentLoading').style.display = 'none';
    document.getElementById('paymentError').textContent = error.message || 'Failed to process payment. Please try again.';
    document.getElementById('paymentError').style.display = 'block';
    document.getElementById('proceedPaymentBtn').disabled = false;
  }
}

/**
 * Upload payment proof
 */
async function uploadPaymentProof() {
  if (!currentPaymentId) {
    alert('Payment ID not found. Please try again.');
    return;
  }

  const fileInput = document.getElementById('proofFile');
  const referenceInput = document.getElementById('paymentReference');

  if (!fileInput.files[0]) {
    alert('Please select a proof file');
    return;
  }

  const formData = new FormData();
  formData.append('proof', fileInput.files[0]);
  formData.append('paymentId', currentPaymentId);
  formData.append('proofType', 'screenshot');
  if (referenceInput.value) {
    formData.append('referenceNumber', referenceInput.value);
  }

  // Show loading
  const uploadBtn = event.target;
  const originalText = uploadBtn.innerHTML;
  uploadBtn.disabled = true;
  uploadBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Uploading...';

  try {
    const response = await fetch('/payment/upload-proof', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (result.success) {
      alert('Proof uploaded successfully! We will verify your payment soon. You will receive access once verified.');
      bootstrap.Modal.getInstance(document.getElementById('paymentModal')).hide();
      location.reload();
    } else {
      throw new Error(result.message || 'Failed to upload proof');
    }
  } catch (error) {
    console.error('Upload error:', error);
    alert('Failed to upload proof: ' + error.message);
    uploadBtn.disabled = false;
    uploadBtn.innerHTML = originalText;
  }
}

// Preview proof file
document.addEventListener('DOMContentLoaded', function () {
  const proofFileInput = document.getElementById('proofFile');
  if (proofFileInput) {
    proofFileInput.addEventListener('change', function (e) {
      const file = e.target.files[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function (e) {
          document.getElementById('proofPreviewImg').src = e.target.result;
          document.getElementById('proofPreview').style.display = 'block';
        };
        reader.readAsDataURL(file);
      } else {
        document.getElementById('proofPreview').style.display = 'none';
      }
    });
  }
});


