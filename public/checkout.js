// Checkout page logic
// ... (rest of the code)

let selectedMethod = null;

document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  setupPaymentMethodCards();
  setupPlaceOrder();
});

function setupPaymentMethodCards() {
  const cards = document.querySelectorAll('.payment-method-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      cards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      selectedMethod = card.getAttribute('data-method');
      document.getElementById('selectedPaymentMethod').value = selectedMethod;
      hideError();
    });
  });
}

function setupPlaceOrder() {
  const btn = document.getElementById('placeOrderBtn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    if (!selectedMethod) {
      showError('Please select a payment method.');
      return;
    }

    const payload = {
      paymentMethod: selectedMethod,
      cartCheckout: !document.getElementById('isMembership'),
      isMembership: !!document.getElementById('isMembership'),
      membershipPlanId: document.getElementById('membershipPlanId')?.value
    };

    // Collect billing if not logged in
    const billingName = document.getElementById('billingName');
    if (billingName) {
      payload.billingName = billingName.value.trim();
      payload.billingEmail = document.getElementById('billingEmail').value.trim();
      payload.billingPhone = document.getElementById('billingPhone').value.trim();
      payload.password = document.getElementById('billingPassword').value;

      if (!payload.billingName || !payload.billingEmail || !payload.password) {
        showError('Please fill your name, email and password.');
        return;
      }
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';

    try {
      const res = await fetch('/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();

      if (!result.success) {
        throw new Error(result.message || 'Checkout failed');
      }

      // Handle methods
      if (selectedMethod.startsWith('slickpay_')) {
        if (result.redirectUrl) {
          window.location.href = result.redirectUrl;
        } else {
          alert('Payment record created. Redirecting to your cart.');
          window.location.href = '/cart/view';
        }
      } else if (selectedMethod === 'whatsapp') {
        const phone = (result.paymentInfo && result.paymentInfo.contact_info && result.paymentInfo.contact_info.phone) || '213540921726';
        const msg = encodeURIComponent(`Hello, I want to pay for my order. Total: ${result.total || ''} DA.`);
        window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${msg}`, '_blank');
        window.location.href = '/course';
      } else {
        // Manual methods (CCP / Baridimob)
        const modalEl = document.getElementById('manualPaymentModal');
        const contentEl = document.getElementById('manualInstructionsContent');

        if (modalEl && contentEl) {
          const info = result.paymentInfo?.contact_info || {};

          contentEl.innerHTML = `
            <div class="instruction-card shadow-sm border-0 bg-light p-4 rounded-4 mb-4">
              <div class="d-flex align-items-center gap-2 mb-3">
                <span class="material-symbols-outlined text-primary">account_balance_wallet</span>
                <span class="fw-bold text-dark text-uppercase small" style="letter-spacing: 0.5px;">Baridimob RIP</span>
              </div>
              <div class="copy-box bg-white border rounded-3 p-3 d-flex justify-content-between align-items-center">
                <code class="fs-5 fw-bold text-primary" style="font-family: 'Outfit', sans-serif;">${info.rip_baridimob || '00799999002692070112'}</code>
                <button class="btn btn-sm btn-outline-primary rounded-pill px-3" onclick="navigator.clipboard.writeText('${info.rip_baridimob || '00799999002692070112'}'); this.textContent='Copied!'">Copy</button>
              </div>
            </div>

            <div class="instruction-card shadow-sm border-0 bg-light p-4 rounded-4 mb-4">
              <div class="d-flex align-items-center gap-2 mb-3">
                <span class="material-symbols-outlined text-primary">account_balance</span>
                <span class="fw-bold text-dark text-uppercase small" style="letter-spacing: 0.5px;">CCP Information</span>
              </div>
              <div class="bg-white border rounded-3 p-3">
                <div class="d-flex justify-content-between mb-2">
                  <span class="text-muted small">Account</span>
                  <span class="fw-bold text-dark">${info.ccp_account || '002692070112'}</span>
                </div>
                <div class="d-flex justify-content-between mb-2">
                  <span class="text-muted small">Name</span>
                  <span class="fw-bold text-dark">${info.name || 'Melihi Akram'}</span>
                </div>
                <div class="d-flex justify-content-between">
                  <span class="text-muted small">City</span>
                  <span class="fw-bold text-dark">${info.city || 'Chlef'}</span>
                </div>
              </div>
            </div>

            <div class="p-4 rounded-4 bg-primary-subtle border border-primary-subtle d-flex align-items-start gap-3">
              <span class="material-symbols-outlined text-primary">info</span>
              <div>
                <div class="fw-bold text-primary small mb-1">Important Note</div>
                <div class="text-primary small opacity-75">${'Veuillez envoyer le reçu de paiement pour activer vos cours instantanément.'}</div>
              </div>
            </div>
          `;

          const modal = new bootstrap.Modal(modalEl);
          modal.show();

          // Handle Proof Upload
          const uploadBtn = document.getElementById('uploadProofBtn');
          const fileInput = document.getElementById('paymentProofFile');

          if (uploadBtn && fileInput) {
            // Store payment IDs for this order
            const firstPaymentId = result.payments?.[0]?.paymentId;

            uploadBtn.onclick = async () => {
              if (!fileInput.files || fileInput.files.length === 0) {
                alert('Please select a file first.');
                return;
              }

              const formData = new FormData();
              formData.append('proof', fileInput.files[0]);
              formData.append('paymentId', firstPaymentId);
              formData.append('proofType', 'manual_transfer');

              uploadBtn.disabled = true;
              uploadBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Uploading...';

              try {
                const uploadRes = await fetch('/payment/upload-proof', {
                  method: 'POST',
                  body: formData
                });
                const uploadResult = await uploadRes.json();

                if (uploadResult.success) {
                  alert('Proof uploaded successfully! Redirecting...');
                  window.location.href = '/course';
                } else {
                  throw new Error(uploadResult.message || 'Upload failed');
                }
              } catch (err) {
                alert('Error: ' + err.message);
                uploadBtn.disabled = false;
                uploadBtn.innerHTML = '<span class="material-symbols-outlined me-1">cloud_upload</span> Upload Proof & Finish';
              }
            };
          }

          // Reset button
          btn.disabled = false;
          btn.innerHTML = '<span class="material-symbols-outlined">lock</span> Confirm enrollment';
        } else {
          alert('Payment created. Please follow manual payment instructions.');
          window.location.href = '/course';
        }
      }
    } catch (err) {
      console.error(err);
      showError(err.message || 'Checkout failed');
      btn.disabled = false;
      btn.innerHTML = '<span class="material-symbols-outlined">lock</span> Confirm enrollment';
    }
  });
}

function showError(msg) {
  const el = document.getElementById('checkoutError');
  const textEl = document.getElementById('errorText');
  if (el) {
    if (textEl) {
      textEl.textContent = msg;
    } else {
      el.textContent = msg;
    }
    el.classList.remove('d-none');
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function hideError() {
  const el = document.getElementById('checkoutError');
  if (el) {
    el.classList.add('d-none');
  }
}

async function removeFromCheckout(courseId) {
  if (!confirm('Remove this course from cart?')) {
    return;
  }

  try {
    const res = await fetch('/cart/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId })
    });
    const result = await res.json();

    if (result.success) {
      // Find all items with this ID and remove them to stay in sync with the server
      const itemsToRemove = document.querySelectorAll(`.order-item[data-course-id="${courseId}"]`);

      if (itemsToRemove.length > 0) {
        itemsToRemove.forEach(item => {
          item.style.transition = 'opacity 0.3s';
          item.style.opacity = '0';
        });

        setTimeout(() => {
          itemsToRemove.forEach(item => item.remove());

          // Check what's left in the DOM
          const remainingItems = document.querySelectorAll('.order-item');
          console.log(`Remaining items in DOM: ${remainingItems.length}`);

          if (remainingItems.length === 0) {
            window.location.href = '/course';
          } else {
            recalculateCheckoutTotal();
          }
        }, 300);
      }

      if (typeof updateCartBadge === 'function') {
        updateCartBadge();
      }
    } else {
      alert(result.message || 'Failed to remove item');
    }
  } catch (err) {
    console.error(err);
    alert('Failed to remove item. Please try again.');
  }
}

async function recalculateCheckoutTotal() {
  try {
    // Add a timestamp as a cache-buster to ensure we get fresh data
    const res = await fetch(`/cart?t=${Date.now()}`);
    if (!res.ok) return;
    const result = await res.json();

    if (result.success && result.total !== undefined) {
      const totalEl = document.getElementById('checkoutTotal');
      if (totalEl) {
        totalEl.textContent = `${result.total} DA`;
      }

      const itemCountSpan = document.getElementById('checkoutItemCount');
      if (itemCountSpan) {
        const count = result.itemCount || 0;
        itemCountSpan.textContent = `Subtotal (${count} Course${count !== 1 ? 's' : ''})`;
      }
    }
  } catch (err) {
    console.error('Error recalculating total:', err);
  }
}

