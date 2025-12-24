// Shopping Cart JavaScript

/**
 * Update cart badge count
 */
/**
 * Update cart badge count
 */
async function updateCartBadge(count) {
  // If global utility version exists and this is not it, use the global one's logic
  // but we can just use the global one since we included it in most pages
  if (typeof window.updateCartBadge === 'function' && window.updateCartBadge.toString().includes('selectors')) {
    // It's already defined globably by cart-utils.js
    return;
  }

  try {
    if (count === undefined) {
      const response = await fetch('/cart/count');
      const result = await response.json();
      if (result.success) count = result.count;
    }

    if (count !== undefined) {
      const badge = document.getElementById('cartBadge');
      if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
      }

      const floatingBadge = document.getElementById('floatingCartBadge');
      if (floatingBadge) {
        floatingBadge.textContent = count;
        floatingBadge.style.display = count > 0 ? 'block' : 'none';
      }
    }
  } catch (error) {
    console.error('Error updating cart badge:', error);
  }
}

/**
 * Create floating cart button (visible on pages that include cart.js)
 */
function initFloatingCartButton() {
  if (document.getElementById('floatingCartBtn')) return;

  const btn = document.createElement('button');
  btn.id = 'floatingCartBtn';
  btn.title = 'View Cart';
  btn.style.cssText = `
    position: fixed;
    right: 20px;
    bottom: 20px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: none;
    background: linear-gradient(135deg, #7b09cd 0%, #9d4edd 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(0,0,0,0.25);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  `;
  btn.innerHTML = `<span class="material-symbols-outlined">shopping_cart</span>
    <span id="floatingCartBadge" style="
      position: absolute;
      top: 6px;
      right: 6px;
      background: #dc3545;
      color: white;
      border-radius: 50%;
      padding: 2px 6px;
      font-size: 0.7rem;
      min-width: 18px;
      text-align: center;
      display: none;
    ">0</span>`;

  btn.addEventListener('click', () => {
    window.location.href = '/cart/view';
  });

  document.body.appendChild(btn);
}

/**
 * Add course to cart
 */
async function addToCart(courseId) {
  try {
    const response = await fetch('/cart/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ courseId })
    });

    const result = await response.json();

    if (result.success) {
      // Show success message
      showCartNotification('Course added to cart!', 'success');
      updateCartBadge();

      // Update button state
      updateAddToCartButton(courseId, true);
    } else {
      showCartNotification(result.message || 'Failed to add to cart', 'error');
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    showCartNotification('Failed to add to cart. Please try again.', 'error');
  }
}

/**
 * Remove item from cart
 */
async function removeFromCart(courseId) {
  if (!confirm('Remove this course from cart?')) {
    return;
  }

  try {
    const response = await fetch('/cart/remove', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ courseId })
    });

    const result = await response.json();

    if (result.success) {
      // Remove item from DOM
      const item = document.querySelector(`.cart-item[data-course-id="${courseId}"]`);
      if (item) {
        item.style.transition = 'opacity 0.3s';
        item.style.opacity = '0';
        setTimeout(() => {
          item.remove();
          updateCartPage();
        }, 300);
      } else {
        location.reload();
      }

      updateCartBadge();
      showCartNotification('Course removed from cart', 'success');
    } else {
      showCartNotification(result.message || 'Failed to remove from cart', 'error');
    }
  } catch (error) {
    console.error('Error removing from cart:', error);
    showCartNotification('Failed to remove from cart. Please try again.', 'error');
  }
}

/**
 * Update cart page (recalculate total, etc.)
 */
async function updateCartPage() {
  try {
    const response = await fetch('/cart');
    const result = await response.json();

    if (result.success) {
      // Reload page to update totals
      if (result.itemCount === 0) {
        location.reload();
      } else {
        // Update totals without reload
        location.reload();
      }
    }
  } catch (error) {
    console.error('Error updating cart page:', error);
  }
}

/**
 * Proceed to checkout
 */
async function proceedToCheckout() {
  try {
    const response = await fetch('/cart');
    const result = await response.json();

    if (!result.success || result.itemCount === 0) {
      alert('Your cart is empty');
      return;
    }

    // Show payment modal for cart checkout
    // For now, redirect to a payment page or show payment modal
    // You can integrate the payment modal here
    alert(`Proceeding to checkout for ${result.itemCount} course(s). Total: ${result.total} DA`);

    // TODO: Open payment modal with cart checkout option
    // For now, redirect to cart with payment option
    window.location.href = `/cart/view?checkout=true`;
  } catch (error) {
    console.error('Error proceeding to checkout:', error);
    alert('Failed to proceed to checkout. Please try again.');
  }
}

/**
 * Show cart notification
 */
function showCartNotification(message, type) {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `cart-notification ${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: ${type === 'success' ? '#28a745' : '#dc3545'};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 9999;
    animation: slideIn 0.3s ease;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

/**
 * Update Add to Cart button state
 */
function updateAddToCartButton(courseId, inCart) {
  const button = document.querySelector(`[data-add-to-cart="${courseId}"]`);
  if (button) {
    if (inCart) {
      button.innerHTML = '<span class="material-symbols-outlined">check</span> In Cart';
      button.disabled = true;
      button.classList.remove('btn-primary');
      button.classList.add('btn-success');
    }
  }
}

// Update cart badge on page load
document.addEventListener('DOMContentLoaded', function () {
  updateCartBadge();
  initFloatingCartButton();
});

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
  .cart-badge {
    background: #dc3545;
    color: white;
    border-radius: 50%;
    padding: 2px 6px;
    font-size: 0.75rem;
    position: absolute;
    top: -5px;
    right: -5px;
    min-width: 18px;
    text-align: center;
  }
  .cart-link {
    position: relative;
    display: inline-flex;
    align-items: center;
  }
`;
document.head.appendChild(style);

