// Global variables
let currentCourseId = null;
let currentChapterId = null;

// Course Management
async function deleteCourse(courseId) {
  if (!confirm('هل أنت متأكد من حذف هذه الدورة؟ سيتم حذف جميع الفصول والدروس.')) return;

  try {
    const response = await fetch(`/admin/deleteCourse/${courseId}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (result.success) {
      alert('تم حذف الدورة بنجاح!');
      location.reload();
    } else {
      alert(result.message || 'فشل في حذف الدورة.');
    }
  } catch (error) {
    console.error('Error deleting course:', error);
    alert('خطأ في الاتصال بالخادم.');
  }
}

async function manageCourse(courseId) {
  currentCourseId = courseId;

  // Get course title
  const courseRow = document.querySelector(`tr:has(button[onclick*="${courseId}"])`);
  const courseTitle = courseRow ? courseRow.querySelector('td strong').textContent : 'دورة';
  document.getElementById('manageCourseTitle').textContent = courseTitle;

  // Load chapters
  await loadChapters(courseId);

  const modal = new bootstrap.Modal(document.getElementById('manageCourseModal'));
  modal.show();
}

// Chapter Management
async function loadChapters(courseId) {
  try {
    const response = await fetch(`/admin/api/courses/${courseId}/chapters`);
    const result = await response.json();

    if (result.success) {
      renderChapters(result.chapters);
    } else {
      console.error('Failed to load chapters');
    }
  } catch (error) {
    console.error('Error loading chapters:', error);
  }
}

async function quickAddChapter() {
  const title = document.getElementById('quickChapterTitle').value.trim();
  if (!title) {
    alert('الرجاء إدخال عنوان الفصل');
    return;
  }

  try {
    const response = await fetch(`/admin/api/courses/${currentCourseId}/chapters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title })
    });

    const result = await response.json();

    if (result.success) {
      document.getElementById('quickChapterTitle').value = '';
      await loadChapters(currentCourseId);
      await loadCourseStats();
    } else {
      alert(result.message || 'فشل في إضافة الفصل');
    }
  } catch (error) {
    console.error('Error adding chapter:', error);
    alert('خطأ في الاتصال بالخادم.');
  }
}

async function deleteChapter(chapterId) {
  if (!confirm('هل أنت متأكد من حذف هذا الفصل؟ سيتم حذف جميع الدروس.')) return;

  try {
    const response = await fetch(`/admin/api/chapters/${chapterId}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (result.success) {
      await loadChapters(currentCourseId);
      await loadCourseStats();
    } else {
      alert(result.message || 'فشل في حذف الفصل');
    }
  } catch (error) {
    console.error('Error deleting chapter:', error);
    alert('خطأ في الاتصال بالخادم.');
  }
}

async function manageChapter(chapterId) {
  currentChapterId = chapterId;

  // Get chapter title
  const chapterRow = document.querySelector(`tr:has(button[onclick*="manageChapter(${chapterId})"])`);
  const chapterTitle = chapterRow ? chapterRow.querySelector('td:nth-child(2) strong').textContent : 'فصل';
  document.getElementById('manageChapterTitle').textContent = chapterTitle;

  // Load lessons
  await loadLessons(chapterId);

  const modal = new bootstrap.Modal(document.getElementById('manageChapterModal'));
  modal.show();
}

async function moveChapterUp(chapterId) {
  try {
    const response = await fetch(`/admin/api/chapters/${chapterId}/order`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ direction: 'up' })
    });

    const result = await response.json();

    if (result.success) {
      await loadChapters(currentCourseId);
    } else {
      alert(result.message || 'لا يمكن نقل الفصل');
    }
  } catch (error) {
    console.error('Error moving chapter:', error);
    alert('خطأ في الاتصال بالخادم.');
  }
}

async function moveChapterDown(chapterId) {
  try {
    const response = await fetch(`/admin/api/chapters/${chapterId}/order`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ direction: 'down' })
    });

    const result = await response.json();

    if (result.success) {
      await loadChapters(currentCourseId);
    } else {
      alert(result.message || 'لا يمكن نقل الفصل');
    }
  } catch (error) {
    console.error('Error moving chapter:', error);
    alert('خطأ في الاتصال بالخادم.');
  }
}

function renderChapters(chapters) {
  const tbody = document.getElementById('chaptersTableBody');

  if (!chapters || chapters.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center">لا توجد فصول بعد. أضف واحداً أعلاه.</td></tr>';
    return;
  }

  tbody.innerHTML = chapters.map(chapter => `
    <tr>
      <td class="text-center"><strong>${chapter.order}</strong></td>
      <td><strong>${chapter.title}</strong></td>
      <td class="text-center chapter-lesson-count-${chapter.id}">0</td>
      <td>
        <button class="btn btn-sm btn-primary" onclick="manageChapter(${chapter.id})" title="إدارة الدروس">
          <span class="material-symbols-outlined">settings</span>
        </button>
        <button class="btn btn-sm btn-order" onclick="moveChapterUp(${chapter.id})" title="نقل لأعلى">
          <span class="material-symbols-outlined">arrow_upward</span>
        </button>
        <button class="btn btn-sm btn-order" onclick="moveChapterDown(${chapter.id})" title="نقل لأسفل">
          <span class="material-symbols-outlined">arrow_downward</span>
        </button>
        <button class="btn btn-sm btn-danger" onclick="deleteChapter(${chapter.id})" title="حذف">
          <span class="material-symbols-outlined">delete</span>
        </button>
      </td>
    </tr>
  `).join('');

  chapters.forEach(chapter => {
    loadLessonCount(chapter.id);
  });
}

async function loadLessonCount(chapterId) {
  try {
    const response = await fetch(`/admin/api/chapters/${chapterId}/lessons`);
    const result = await response.json();

    if (result.success) {
      const countElement = document.querySelector(`.chapter-lesson-count-${chapterId}`);
      if (countElement) {
        countElement.textContent = result.lessons.length;
      }
    }
  } catch (error) {
    console.error('Error loading lesson count:', error);
  }
}

// Lesson Management
async function loadLessons(chapterId) {
  try {
    const response = await fetch(`/admin/api/chapters/${chapterId}/lessons`);
    const result = await response.json();

    if (result.success) {
      renderLessons(result.lessons);
    } else {
      console.error('Failed to load lessons');
    }
  } catch (error) {
    console.error('Error loading lessons:', error);
  }
}

async function quickAddLesson() {
  const title = document.getElementById('quickLessonTitle').value.trim();
  const videoUrl = document.getElementById('quickLessonVideoUrl').value.trim();

  if (!title) {
    alert('الرجاء إدخال عنوان الدرس');
    return;
  }

  if (!videoUrl) {
    alert('الرجاء إدخال رابط الفيديو');
    return;
  }

  try {
    const response = await fetch(`/admin/api/chapters/${currentChapterId}/lessons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, videoUrl })
    });

    const result = await response.json();

    if (result.success) {
      document.getElementById('quickLessonTitle').value = '';
      document.getElementById('quickLessonVideoUrl').value = '';
      await loadLessons(currentChapterId);
      await loadLessonCount(currentChapterId);
    } else {
      alert(result.message || 'فشل في إضافة الدرس');
    }
  } catch (error) {
    console.error('Error adding lesson:', error);
    alert('خطأ في الاتصال بالخادم.');
  }
}

async function deleteLesson(lessonId) {
  if (!confirm('هل أنت متأكد من حذف هذا الدرس؟')) return;

  try {
    const response = await fetch(`/admin/api/lessons/${lessonId}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (result.success) {
      await loadLessons(currentChapterId);
      await loadLessonCount(currentChapterId);
    } else {
      alert(result.message || 'فشل في حذف الدرس');
    }
  } catch (error) {
    console.error('Error deleting lesson:', error);
    alert('خطأ في الاتصال بالخادم.');
  }
}

async function moveLessonUp(lessonId) {
  try {
    const response = await fetch(`/admin/api/lessons/${lessonId}/order`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ direction: 'up' })
    });

    const result = await response.json();

    if (result.success) {
      await loadLessons(currentChapterId);
    } else {
      alert(result.message || 'لا يمكن نقل الدرس');
    }
  } catch (error) {
    console.error('Error moving lesson:', error);
    alert('خطأ في الاتصال بالخادم.');
  }
}

async function moveLessonDown(lessonId) {
  try {
    const response = await fetch(`/admin/api/lessons/${lessonId}/order`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ direction: 'down' })
    });

    const result = await response.json();

    if (result.success) {
      await loadLessons(currentChapterId);
    } else {
      alert(result.message || 'لا يمكن نقل الدرس');
    }
  } catch (error) {
    console.error('Error moving lesson:', error);
    alert('خطأ في الاتصال بالخادم.');
  }
}

function renderLessons(lessons) {
  const tbody = document.getElementById('lessonsTableBody');

  if (!lessons || lessons.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center">لا توجد دروس بعد. أضف واحداً أعلاه.</td></tr>';
    return;
  }

  tbody.innerHTML = lessons.map(lesson => `
    <tr>
      <td class="text-center"><strong>${lesson.order_number}</strong></td>
      <td><strong>${lesson.title}</strong></td>
      <td>
        <a href="${lesson.content_url}" target="_blank" class="text-decoration-none">
          ${lesson.content_url}
          <span class="material-symbols-outlined" style="font-size: 16px; vertical-align: middle;">open_in_new</span>
        </a>
      </td>
      <td>
        <button class="btn btn-sm btn-order" onclick="moveLessonUp(${lesson.lesson_id})" title="نقل لأعلى">
          <span class="material-symbols-outlined">arrow_upward</span>
        </button>
        <button class="btn btn-sm btn-order" onclick="moveLessonDown(${lesson.lesson_id})" title="نقل لأسفل">
          <span class="material-symbols-outlined">arrow_downward</span>
        </button>
        <button class="btn btn-sm btn-danger" onclick="deleteLesson(${lesson.lesson_id})" title="حذف">
          <span class="material-symbols-outlined">delete</span>
        </button>
      </td>
    </tr>
  `).join('');
}

// Course Stats
async function loadCourseStats() {
  const courseRows = document.querySelectorAll('#coursesTableBody tr');

  for (const row of courseRows) {
    const manageButton = row.querySelector('button[onclick*="manageCourse"]');
    if (manageButton) {
      const courseIdMatch = manageButton.getAttribute('onclick').match(/manageCourse\((\d+)\)/);
      if (courseIdMatch) {
        const courseId = courseIdMatch[1];
        try {
          const response = await fetch(`/admin/api/courses/${courseId}/stats`);
          const result = await response.json();

          if (result.success) {
            const chapterCountCell = row.querySelector(`.chapter-count-${courseId}`);
            const lessonCountCell = row.querySelector(`.lesson-count-${courseId}`);

            if (chapterCountCell) chapterCountCell.textContent = result.stats.chaptersCount;
            if (lessonCountCell) lessonCountCell.textContent = result.stats.lessonsCount;
          }
        } catch (error) {
          console.error('Error loading course stats:', error);
        }
      }
    }
  }
}

// Clients Management
async function loadClients() {
  try {
    const response = await fetch('/admin/api/clients');
    const result = await response.json();

    if (result.success) {
      renderClients(result.clients);
    } else {
      console.error('Failed to load clients');
    }
  } catch (error) {
    console.error('Error loading clients:', error);
  }
}

function renderClients(clients) {
  const tbody = document.getElementById('clientsTableBody');

  if (!clients || clients.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">لا يوجد عملاء مسجلون بعد.</td></tr>';
    return;
  }

  tbody.innerHTML = clients.map(client => {
    // Membership logic
    const membershipTier = client.membership_tier || 'Free';
    const membershipExpiry = client.membership_expiry ? new Date(client.membership_expiry).toLocaleDateString('ar-DZ') : 'أبداً';
    const isPremium = membershipTier === 'Pro' || membershipTier === 'VIP';

    let membershipBadge = '';
    if (membershipTier === 'VIP') {
      membershipBadge = '<span class="badge bg-warning text-dark">👑 VIP</span>';
    } else if (membershipTier === 'Pro') {
      membershipBadge = '<span class="badge bg-primary">💎 PRO</span>';
    } else {
      membershipBadge = '<span class="badge bg-secondary">🌱 مجاني</span>';
    }

    const membershipHTML = `
      <div class="small">
        <div class="mb-1">${membershipBadge}</div>
        ${isPremium ? `<div class="text-muted" style="font-size: 10px;">تنتهي في: ${membershipExpiry}</div>` : ''}
      </div>
    `;

    return `
      <tr>
        <td><strong>${client.fullname}</strong></td>
        <td>${client.email}</td>
        <td>${membershipHTML}</td>
        <td><span class="badge badge-success">نشط</span></td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="viewClient(${client.id}, '${client.fullname}', '${client.email}', '${membershipTier}')" title="عرض التفاصيل">
            <span class="material-symbols-outlined">visibility</span>
          </button>
          <button class="btn btn-sm btn-warning" onclick="openGiveMembershipModal(${client.id}, '${client.fullname.replace(/'/g, "\\'")}')" title="منح عضوية" style="background-color: #7b09cd; border-color: #7b09cd; color: white;">
            <span class="material-symbols-outlined">workspace_premium</span>
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteClient(${client.id})" title="حذف">
            <span class="material-symbols-outlined">delete</span>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function openGiveMembershipModal(clientId, clientName) {
  document.getElementById('membershipClientId').value = clientId;
  document.getElementById('membershipClientName').textContent = clientName;
  document.getElementById('membershipMessage').style.display = 'none';

  const modal = new bootstrap.Modal(document.getElementById('giveMembershipModal'));
  modal.show();

  // Handle Revoke
  document.getElementById('revokeMembershipBtn').onclick = async () => {
    if (!confirm('هل أنت متأكد من إلغاء العضوية المميزة لهذا المستخدم؟')) return;

    const message = document.getElementById('membershipMessage');
    try {
      const response = await fetch('/admin/api/clients/remove-membership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId })
      });
      const result = await response.json();
      if (result.success) {
        message.className = 'alert alert-success mt-3 py-2 small';
        message.textContent = 'تم إلغاء العضوية بنجاح';
        message.style.display = 'block';
        setTimeout(() => { modal.hide(); loadClients(); }, 1500);
      } else {
        message.className = 'alert alert-danger mt-3 py-2 small';
        message.textContent = result.message;
        message.style.display = 'block';
      }
    } catch (e) {
      console.error(e);
      message.className = 'alert alert-danger mt-3 py-2 small';
      message.textContent = 'خطأ في إلغاء العضوية';
      message.style.display = 'block';
    }
  };

  // Handle form submission
  const form = document.getElementById('giveMembershipForm');
  form.onsubmit = async (e) => {
    e.preventDefault();

    const tier = form.elements['membershipTier'].value;
    const duration = document.getElementById('membershipDuration').value;
    const message = document.getElementById('membershipMessage');
    const submitBtn = form.querySelector('button[type="submit"]');

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>تفعيل...';

    try {
      const response = await fetch('/admin/api/clients/give-membership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, tier, duration })
      });

      const result = await response.json();

      if (result.success) {
        message.className = 'alert alert-success mt-3 py-2 small';
        message.textContent = 'تم تفعيل العضوية بنجاح';
        message.style.display = 'block';
        setTimeout(() => {
          modal.hide();
          loadClients();
        }, 1500);
      } else {
        message.className = 'alert alert-danger mt-3 py-2 small';
        message.textContent = result.message || 'فشل في منح العضوية';
        message.style.display = 'block';
      }
    } catch (error) {
      console.error('Error giving membership:', error);
      message.className = 'alert alert-danger mt-3 py-2 small';
      message.textContent = 'خطأ في الاتصال بالخادم';
      message.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'تفعيل العضوية';
    }
  };
}

function filterClients() {
  const searchTerm = document.getElementById('clientSearch').value.toLowerCase();
  const rows = document.querySelectorAll('#clientsTableBody tr');
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(searchTerm) ? '' : 'none';
  });
}

function viewClient(clientId, name, email, membership) {
  alert(`تفاصيل العميل:\n\nالاسم: ${name}\nالبريد الإلكتروني: ${email}\nالعضوية: ${membership}`);
}

async function deleteClient(clientId) {
  if (!confirm('هل أنت متأكد من حذف هذا العميل؟')) return;

  try {
    const response = await fetch(`/admin/api/clients/${clientId}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (result.success) {
      await loadClients();
    } else {
      alert(result.message || 'فشل في حذف العميل');
    }
  } catch (error) {
    console.error('Error deleting client:', error);
    alert('خطأ في الاتصال بالخادم.');
  }
}

// Purchases Management
async function loadPurchases() {
  try {
    const response = await fetch('/admin/api/purchases');
    const result = await response.json();

    if (result.success) {
      renderPurchases(result.purchases);
    } else {
      console.error('Failed to load purchases');
    }
  } catch (error) {
    console.error('Error loading purchases:', error);
  }
}

function renderPurchases(purchases) {
  const tbody = document.getElementById('purchasesTableBody');

  if (!purchases || purchases.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">لا توجد مشتريات بعد.</td></tr>';
    document.getElementById('totalPurchasesAr').textContent = '0';
    document.getElementById('totalRevenueAr').textContent = '0 دج';
    document.getElementById('todayPurchasesAr').textContent = '0';
    return;
  }

  const totalPurchases = purchases.length;
  const totalRevenue = purchases
    .filter(p => p.paid === 1)
    .reduce((sum, p) => sum + parseFloat(p.price || 0), 0);
  const today = new Date().toISOString().split('T')[0];
  const todayPurchases = purchases.filter(p => p.purchase_date === today).length;

  document.getElementById('totalPurchasesAr').textContent = totalPurchases;
  document.getElementById('totalRevenueAr').textContent = totalRevenue.toFixed(2) + ' دج';
  document.getElementById('todayPurchasesAr').textContent = todayPurchases;

  tbody.innerHTML = purchases.map(purchase => `
    <tr>
      <td><strong>#${purchase.id}</strong></td>
      <td>${purchase.client_name || 'غير معروف'}</td>
      <td>${purchase.course_title || 'دورة غير معروفة'}</td>
      <td><strong>${purchase.price || 0} دج</strong></td>
      <td>${new Date(purchase.purchase_date).toLocaleDateString('ar-SA')}</td>
      <td><span class="badge ${purchase.paid === 1 ? 'badge-success' : 'badge-warning'}">${purchase.paid === 1 ? 'مدفوع' : 'معلق'}</span></td>
      <td>
        <button class="btn btn-sm btn-primary" onclick="viewPurchase(${purchase.id}, '${purchase.client_name || 'غير معروف'}', '${purchase.course_title || 'غير معروف'}', '${purchase.price || 0}', '${purchase.purchase_date}')" title="عرض التفاصيل">
          <span class="material-symbols-outlined">visibility</span>
        </button>
      </td>
    </tr>
  `).join('');
}

function filterPurchases(filter) {
  document.querySelectorAll('.btn-filter').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');

  const tbody = document.getElementById('purchasesTableBody');
  const rows = tbody.querySelectorAll('tr');
  const now = new Date();

  rows.forEach(row => {
    const dateText = row.cells[4]?.textContent;
    if (!dateText) return;

    const purchaseDate = new Date(dateText);
    let show = true;

    if (filter === 'today') {
      show = purchaseDate.toDateString() === now.toDateString();
    } else if (filter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      show = purchaseDate >= weekAgo;
    } else if (filter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      show = purchaseDate >= monthAgo;
    }

    row.style.display = show ? '' : 'none';
  });
}

function viewPurchase(purchaseId, clientName, courseTitle, amount, date) {
  alert(`تفاصيل الشراء:\n\nالرقم: #${purchaseId}\nالعميل: ${clientName}\nالدورة: ${courseTitle}\nالمبلغ: ${amount} دج\nالتاريخ: ${new Date(date).toLocaleDateString('ar-SA')}`);
}

// Dashboard Stats
async function loadDashboardStats() {
  try {
    const response = await fetch('/admin/api/stats');
    const result = await response.json();

    if (result.success) {
      const stats = result.stats;
      document.getElementById('totalUsersAr')?.textContent = stats.totalUsers || 0;
      document.getElementById('totalCoursesAr')?.textContent = stats.totalCourses || 0;
      document.getElementById('totalPurchasesAr')?.textContent = stats.totalPurchases || 0;
      document.getElementById('totalEarningsAr')?.textContent = (stats.totalRevenue || 0).toFixed(2) + ' دج';
    } else {
      console.error('Failed to load dashboard stats');
    }
  } catch (error) {
    console.error('Error loading dashboard stats:', error);
  }
}

// Course Management
function openAddCourseModal() {
  document.getElementById('addCourseForm').reset();
  const modal = new bootstrap.Modal(document.getElementById('addCourseModal'));
  modal.show();
}

// Session check
async function checkSession() {
  try {
    const response = await fetch('/api/check-session', {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok || response.status === 401) {
      window.location.replace('/login/ar');
      return false;
    }
    return true;
  } catch (error) {
    console.error('Session check failed:', error);
    window.location.replace('/login/ar');
    return false;
  }
}

// Check session on page load and navigation
window.addEventListener('load', checkSession);
window.addEventListener('pageshow', async (event) => {
  if (event.persisted) {
    await checkSession();
  }
});
window.addEventListener('popstate', checkSession);

