// Global variables
let currentCourseId = null;
let currentChapterId = null;

// Course Management
async function deleteCourse(courseId) {
  if (!confirm('Are you sure you want to delete this course? All chapters and lessons will be deleted.')) return;

  try {
    const response = await fetch(`/admin/deleteCourse/${courseId}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (result.success) {
      alert('Course deleted successfully!');
      location.reload();
    } else {
      alert(result.message || 'Failed to delete the course.');
    }
  } catch (error) {
    console.error('Error deleting course:', error);
    alert('Error connecting to the server.');
  }
}

async function manageCourse(courseId) {
  currentCourseId = courseId;

  // Get course title
  const courseRow = document.querySelector(`tr:has(button[onclick*="${courseId}"])`);
  const courseTitle = courseRow ? courseRow.querySelector('td strong').textContent : 'Course';
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
    alert('Please enter a chapter title');
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
      await loadCourseStats(); // Update course stats
    } else {
      alert(result.message || 'Failed to add chapter');
    }
  } catch (error) {
    console.error('Error adding chapter:', error);
    alert('Error connecting to the server.');
  }
}

async function deleteChapter(chapterId) {
  if (!confirm('Are you sure you want to delete this chapter? All lessons will be deleted.')) return;

  try {
    const response = await fetch(`/admin/api/chapters/${chapterId}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (result.success) {
      await loadChapters(currentCourseId);
      await loadCourseStats(); // Update course stats
    } else {
      alert(result.message || 'Failed to delete chapter');
    }
  } catch (error) {
    console.error('Error deleting chapter:', error);
    alert('Error connecting to the server.');
  }
}

async function manageChapter(chapterId) {
  currentChapterId = chapterId;

  // Get chapter title
  const chapterRow = document.querySelector(`tr:has(button[onclick*="manageChapter(${chapterId})"])`);
  const chapterTitle = chapterRow ? chapterRow.querySelector('td:nth-child(2) strong').textContent : 'Chapter';
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
      alert(result.message || 'Cannot move chapter');
    }
  } catch (error) {
    console.error('Error moving chapter:', error);
    alert('Error connecting to the server.');
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
      alert(result.message || 'Cannot move chapter');
    }
  } catch (error) {
    console.error('Error moving chapter:', error);
    alert('Error connecting to the server.');
  }
}

function renderChapters(chapters) {
  const tbody = document.getElementById('chaptersTableBody');

  if (!chapters || chapters.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">No chapters yet. Add one above.</td></tr>';
    return;
  }

  tbody.innerHTML = chapters.map(chapter => `
    <tr>
      <td class="text-center"><strong>${chapter.order}</strong></td>
      <td><strong>${chapter.title}</strong></td>
      <td class="text-center">
        <button class="btn btn-sm ${chapter.is_free ? 'btn-success' : 'btn-warning'}" 
                onclick="toggleChapterFree(${chapter.id}, ${chapter.is_free ? 1 : 0})"
                title="Click to toggle Free/Paid status"
                style="min-width: 70px;">
          ${chapter.is_free ? '🆓 FREE' : '💰 PAID'}
        </button>
      </td>
      <td class="text-center chapter-lesson-count-${chapter.id}">0</td>
      <td>
        <button class="btn btn-sm btn-primary" onclick="manageChapter(${chapter.id})" title="Manage Lessons">
          <span class="material-symbols-outlined">settings</span>
        </button>
        <button class="btn btn-sm btn-info" onclick="editChapter(${chapter.id}, '${chapter.title.replace(/'/g, "\\'")}')" title="Edit Chapter">
          <span class="material-symbols-outlined">edit</span>
        </button>
        <button class="btn btn-sm btn-order" onclick="moveChapterUp(${chapter.id})" title="Move Up">
          <span class="material-symbols-outlined">arrow_upward</span>
        </button>
        <button class="btn btn-sm btn-order" onclick="moveChapterDown(${chapter.id})" title="Move Down">
          <span class="material-symbols-outlined">arrow_downward</span>
        </button>
        <button class="btn btn-sm btn-danger" onclick="deleteChapter(${chapter.id})" title="Delete">
          <span class="material-symbols-outlined">delete</span>
        </button>
      </td>
    </tr>
  `).join('');

  // Load lesson counts for each chapter
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

async function uploadVideoToYouTube(videoFile, title, description, progressBar) {
  const formData = new FormData();
  formData.append('video', videoFile);
  formData.append('title', title || 'Untitled Video');
  formData.append('description', description || '');

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && progressBar) {
        const percentComplete = (e.loaded / e.total) * 100;
        progressBar.style.width = percentComplete + '%';
        progressBar.textContent = Math.round(percentComplete) + '%';
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          const result = JSON.parse(xhr.responseText);
          if (result.success) {
            resolve(result.videoUrl);
          } else {
            if (result.needsAuth) {
              // Get auth URL and redirect
              fetch('/admin/youtube/auth-url')
                .then(res => res.json())
                .then(authResult => {
                  if (authResult.success) {
                    window.location.href = authResult.authUrl;
                  } else {
                    reject(new Error(authResult.message || 'Failed to get YouTube auth URL'));
                  }
                })
                .catch(err => {
                  reject(new Error('Failed to get YouTube auth URL'));
                });
              reject(new Error('YouTube authentication required'));
            } else {
              reject(new Error(result.message || 'Upload failed'));
            }
          }
        } catch (e) {
          reject(new Error('Invalid response from server'));
        }
      } else {
        reject(new Error('Upload failed with status: ' + xhr.status));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.open('POST', '/admin/youtube/upload');
    xhr.send(formData);
  });
}

async function quickAddLesson() {
  const title = document.getElementById('quickLessonTitle').value.trim();

  if (!title) {
    alert('Please enter a lesson title');
    return;
  }

  let videoUrl = '';
  const lessonVideoType = document.querySelector('input[name="lessonVideoType"]:checked')?.value;

  // Handle video upload or URL
  if (lessonVideoType === 'upload') {
    const videoFile = document.getElementById('quickLessonVideoFile');
    if (!videoFile || !videoFile.files[0]) {
      alert('Please select a video file to upload');
      return;
    }

    const progressBar = document.querySelector('#lessonVideoProgress .progress-bar');
    const progressContainer = document.getElementById('lessonVideoProgress');
    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
    progressBar.textContent = '0%';

    try {
      videoUrl = await uploadVideoToYouTube(
        videoFile.files[0],
        title,
        '',
        progressBar
      );
      progressContainer.style.display = 'none';
    } catch (error) {
      progressContainer.style.display = 'none';
      alert(error.message || 'Failed to upload video to YouTube');
      return;
    }
  } else {
    videoUrl = document.getElementById('quickLessonVideoUrl').value.trim();
    if (!videoUrl) {
      alert('Please enter a video URL');
      return;
    }
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
      const videoFileInput = document.getElementById('quickLessonVideoFile');
      if (videoFileInput) videoFileInput.value = '';
      await loadLessons(currentChapterId);
      await loadLessonCount(currentChapterId); // Update lesson count in chapter table
    } else {
      alert(result.message || 'Failed to add lesson');
    }
  } catch (error) {
    console.error('Error adding lesson:', error);
    alert('Error connecting to the server.');
  }
}

async function deleteLesson(lessonId) {
  if (!confirm('Are you sure you want to delete this lesson?')) return;

  try {
    const response = await fetch(`/admin/api/lessons/${lessonId}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (result.success) {
      await loadLessons(currentChapterId);
      await loadLessonCount(currentChapterId); // Update lesson count in chapter table
    } else {
      alert(result.message || 'Failed to delete lesson');
    }
  } catch (error) {
    console.error('Error deleting lesson:', error);
    alert('Error connecting to the server.');
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
      alert(result.message || 'Cannot move lesson');
    }
  } catch (error) {
    console.error('Error moving lesson:', error);
    alert('Error connecting to the server.');
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
      alert(result.message || 'Cannot move lesson');
    }
  } catch (error) {
    console.error('Error moving lesson:', error);
    alert('Error connecting to the server.');
  }
}

function renderLessons(lessons) {
  const tbody = document.getElementById('lessonsTableBody');

  if (!lessons || lessons.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">No lessons yet. Add one above.</td></tr>';
    return;
  }

  tbody.innerHTML = lessons.map(lesson => `
    <tr>
      <td class="text-center"><strong>${lesson.order_number}</strong></td>
      <td><strong>${lesson.title}</strong></td>
      <td class="text-center">
        <button class="btn btn-sm ${lesson.is_free ? 'btn-success' : 'btn-warning'}" 
                onclick="toggleLessonFree(${lesson.lesson_id}, ${lesson.is_free ? 1 : 0})"
                title="Click to toggle Free/Paid status"
                style="min-width: 70px;">
          ${lesson.is_free ? '🆓 FREE' : '💰 PAID'}
        </button>
      </td>
      <td>
        <a href="${lesson.content_url}" target="_blank" class="text-decoration-none">
          ${lesson.content_url}
          <span class="material-symbols-outlined" style="font-size: 16px; vertical-align: middle;">open_in_new</span>
        </a>
      </td>
      <td>
        <button class="btn btn-sm btn-info" onclick="editLesson(${lesson.lesson_id}, '${lesson.title.replace(/'/g, "\\'")}', '${lesson.content_url.replace(/'/g, "\\'")}')" title="Edit Lesson">
          <span class="material-symbols-outlined">edit</span>
        </button>
        <button class="btn btn-sm btn-order" onclick="moveLessonUp(${lesson.lesson_id})" title="Move Up">
          <span class="material-symbols-outlined">arrow_upward</span>
        </button>
        <button class="btn btn-sm btn-order" onclick="moveLessonDown(${lesson.lesson_id})" title="Move Down">
          <span class="material-symbols-outlined">arrow_downward</span>
        </button>
        <button class="btn btn-sm btn-danger" onclick="deleteLesson(${lesson.lesson_id})" title="Delete">
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
      // Load purchased courses for each client
      const clientsWithCourses = await Promise.all(result.clients.map(async (client) => {
        const purchasesResponse = await fetch(`/admin/api/clients/${client.id}/purchases`);
        const purchasesResult = await purchasesResponse.json();
        return {
          ...client,
          purchasedCourses: purchasesResult.success ? purchasesResult.courses : []
        };
      }));

      renderClients(clientsWithCourses);
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
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">No clients registered yet.</td></tr>';
    return;
  }

  tbody.innerHTML = clients.map(client => {
    // Calculate overall progress
    let totalCourses = client.purchasedCourses.length;
    let completedCourses = client.purchasedCourses.filter(c => c.progress && c.progress.isCompleted).length;
    let overallProgress = totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;

    // Determine client type
    const isPaying = totalCourses > 0;
    const isActive = overallProgress > 0;
    const clientType = isPaying ? 'paying' : 'free';
    const clientTypeClass = isPaying ? 'active' : 'inactive';

    // Type badge
    const typeBadge = isPaying
      ? '<span class="badge badge-success" style="background: linear-gradient(135deg, #10b981, #34d399);">💳 Paying Customer</span>'
      : '<span class="badge badge-secondary" style="background: #9ca3af;">🆓 Free User</span>';

    // Build progress display
    let progressHTML = '';
    if (totalCourses === 0) {
      progressHTML = '<span class="text-muted">No courses</span>';
    } else {
      const progressColor = overallProgress >= 75 ? '#10b981' : overallProgress >= 50 ? '#f59e0b' : '#3b82f6';
      progressHTML = `
        <div style="min-width: 150px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
            <small><strong>${completedCourses}/${totalCourses}</strong> completed</small>
            <small><strong>${overallProgress}%</strong></small>
          </div>
          <div class="progress" style="height: 8px; background-color: #e9ecef; border-radius: 4px; overflow: hidden;">
            <div class="progress-bar" role="progressbar" style="width: ${overallProgress}%; background: ${progressColor};" 
                 aria-valuenow="${overallProgress}" aria-valuemin="0" aria-valuemax="100"></div>
          </div>
        </div>
      `;
    }

    // Courses display
    const coursesHTML = totalCourses > 0
      ? `<span class="badge badge-info" style="font-size: 12px;">${totalCourses} ${totalCourses === 1 ? 'Course' : 'Courses'}</span>`
      : '<span class="text-muted">None</span>';

    // Status badge
    const statusBadge = isActive
      ? '<span class="badge badge-success">🟢 Active</span>'
      : '<span class="badge" style="background: #9ca3af; color: white;">⚪ Inactive</span>';

    // Membership display
    const membershipTier = client.membership_tier || 'Free';
    const membershipExpiry = client.membership_expiry ? new Date(client.membership_expiry).toLocaleDateString() : 'Never';
    const isPremium = membershipTier === 'Pro' || membershipTier === 'VIP';

    let membershipBadge = '';
    if (membershipTier === 'VIP') {
      membershipBadge = '<span class="badge bg-warning text-dark">👑 VIP</span>';
    } else if (membershipTier === 'Pro') {
      membershipBadge = '<span class="badge bg-primary">💎 PRO</span>';
    } else {
      membershipBadge = '<span class="badge bg-secondary">🌱 Free</span>';
    }

    const membershipHTML = `
      <div class="small">
        <div class="mb-1">${membershipBadge}</div>
        ${isPremium ? `<div class="text-muted" style="font-size: 10px;">Expires: ${membershipExpiry}</div>` : ''}
      </div>
    `;

    return `
      <tr data-client-type="${clientType}" data-client-active="${isActive}">
        <td data-label="Name"><strong>${client.fullname}</strong></td>
        <td data-label="Email">${client.email}</td>
        <td data-label="Type">${typeBadge}</td>
        <td data-label="Courses">${coursesHTML}</td>
        <td data-label="Progress">${progressHTML}</td>
        <td data-label="Membership">${membershipHTML}</td>
        <td data-label="Status">${statusBadge}</td>
        <td data-label="Actions">
          <button class="btn btn-sm btn-info" onclick="viewClientDetails(${client.id}, '${client.fullname.replace(/'/g, "\\'")}', '${client.email.replace(/'/g, "\\'")}', ${totalCourses}, ${overallProgress}, '${membershipTier}', '${membershipExpiry}')" title="View Details">
            <span class="material-symbols-outlined">visibility</span>
          </button>
          <button class="btn btn-sm btn-primary" onclick="viewClientProgress(${client.id}, '${client.fullname.replace(/'/g, "\\'")}', '${client.email.replace(/'/g, "\\'")}')\" title="View Progress">
            <span class="material-symbols-outlined">analytics</span>
          </button>
          <button class="btn btn-sm btn-success" onclick="addCourseToClient(${client.id}, '${client.fullname.replace(/'/g, "\\'")}')" title="Add Course">
            <span class="material-symbols-outlined">add</span>
          </button>
          <button class="btn btn-sm btn-warning" onclick="openGiveMembershipModal(${client.id}, '${client.fullname.replace(/'/g, "\\'")}')" title="Give Membership" style="background-color: #7b09cd; border-color: #7b09cd; color: white;">
            <span class="material-symbols-outlined">workspace_premium</span>
          </button>
          ${totalCourses > 0 ? `
          <button class="btn btn-sm btn-outline-warning" onclick="removeCourseFromClient(${client.id}, '${client.fullname.replace(/'/g, "\\'")}')" title="Remove Course">
            <span class="material-symbols-outlined">remove</span>
          </button>
          ` : ''}
          <button class="btn btn-sm btn-danger" onclick="deleteClient(${client.id})" title="Delete">
            <span class="material-symbols-outlined">delete</span>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Update statistics
  updateClientStats();
}

function openGiveMembershipModal(clientId, clientName) {
  document.getElementById('membershipClientId').value = clientId;
  document.getElementById('membershipClientName').textContent = clientName;
  document.getElementById('membershipMessage').style.display = 'none';

  const modal = new bootstrap.Modal(document.getElementById('giveMembershipModal'));
  modal.show();

  // Handle Revoke
  document.getElementById('revokeMembershipBtn').onclick = async () => {
    if (!confirm('Are you sure you want to revoke this user\'s premium access?')) return;

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
        message.textContent = result.message;
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
      message.textContent = 'Error revoking membership';
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
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Activating...';

    try {
      const response = await fetch('/admin/api/clients/give-membership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, tier, duration })
      });

      const result = await response.json();

      if (result.success) {
        message.className = 'alert alert-success mt-3 py-2 small';
        message.textContent = result.message;
        message.style.display = 'block';
        setTimeout(() => {
          modal.hide();
          loadClients(); // Refresh to show new stats if any
        }, 1500);
      } else {
        message.className = 'alert alert-danger mt-3 py-2 small';
        message.textContent = result.message || 'Failed to assign membership';
        message.style.display = 'block';
      }
    } catch (error) {
      console.error('Error giving membership:', error);
      message.className = 'alert alert-danger mt-3 py-2 small';
      message.textContent = 'Error connecting to server';
      message.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Activate Membership';
    }
  };
}

async function removeCourseFromClient(clientId, clientName) {
  // Load client's purchased courses
  try {
    const response = await fetch(`/admin/api/clients/${clientId}/purchases`);
    const result = await response.json();

    if (!result.success || result.courses.length === 0) {
      alert('This client has no purchased courses');
      return;
    }

    document.getElementById('selectedClientIdRemove').value = clientId;
    document.getElementById('removeCourseFromClientModalLabel').textContent = `Remove Course from ${clientName}`;

    const select = document.getElementById('clientCourseSelectRemove');
    select.innerHTML = '<option value="">-- Select Course to Remove --</option>' +
      result.courses.map(course =>
        `<option value="${course.course_id}">${course.course_title} - ${course.price} DA</option>`
      ).join('');

    const modal = new bootstrap.Modal(document.getElementById('removeCourseFromClientModal'));
    modal.show();
  } catch (error) {
    console.error('Error loading courses:', error);
    alert('Error loading courses');
  }

  // Setup form submission
  const form = document.getElementById('removeCourseFromClientForm');
  form.onsubmit = async (e) => {
    e.preventDefault();
    const courseId = document.getElementById('clientCourseSelectRemove').value;
    const message = document.getElementById('messageClientCourseRemove');

    if (!courseId) {
      message.textContent = 'Please select a course';
      message.style.display = 'block';
      message.style.color = 'red';
      return;
    }

    if (!confirm('Are you sure you want to remove this course from the client? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/admin/api/clients/remove-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          courseId
        })
      });

      const result = await response.json();

      if (result.success) {
        message.textContent = result.message;
        message.style.display = 'block';
        message.style.color = 'green';
        setTimeout(() => {
          bootstrap.Modal.getInstance(document.getElementById('removeCourseFromClientModal')).hide();
          loadClients();
        }, 1000);
      } else {
        message.textContent = result.message || 'Failed to remove course';
        message.style.color = 'red';
      }
    } catch (error) {
      message.textContent = 'Error connecting to server';
      message.style.color = 'red';
    }
  };
}

async function addCourseToClient(clientId, clientName) {
  document.getElementById('selectedClientId').value = clientId;
  document.getElementById('addCourseToClientModalLabel').textContent = `Add Course to ${clientName}`;

  // Load available courses
  try {
    const response = await fetch('/admin/api/courses');
    const result = await response.json();

    if (result.success) {
      const select = document.getElementById('clientCourseSelect');
      select.innerHTML = '<option value="">-- Select Course --</option>' +
        result.courses.map(course =>
          `<option value="${course.course_id}">${course.title} - ${course.price} DA</option>`
        ).join('');

      const modal = new bootstrap.Modal(document.getElementById('addCourseToClientModal'));
      modal.show();
    }
  } catch (error) {
    console.error('Error loading courses:', error);
    alert('Error loading courses');
  }

  // Setup form submission
  const form = document.getElementById('addCourseToClientForm');
  form.onsubmit = async (e) => {
    e.preventDefault();
    const courseId = document.getElementById('clientCourseSelect').value;
    const message = document.getElementById('messageClientCourse');

    if (!courseId) {
      message.textContent = 'Please select a course';
      message.style.display = 'block';
      message.style.color = 'red';
      return;
    }

    try {
      const response = await fetch('/admin/api/clients/add-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          courseId
        })
      });

      const result = await response.json();

      if (result.success) {
        message.textContent = result.message;
        message.style.display = 'block';
        message.style.color = 'green';
        setTimeout(() => {
          bootstrap.Modal.getInstance(document.getElementById('addCourseToClientModal')).hide();
          loadClients();
        }, 1000);
      } else {
        message.textContent = result.message || 'Failed to add course';
        message.style.color = 'red';
      }
    } catch (error) {
      message.textContent = 'Error connecting to server';
      message.style.color = 'red';
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

function viewClient(clientId, name, email) {
  alert(`Client Details:\n\nName: ${name}\nEmail: ${email}`);
}

async function viewClientProgress(clientId, name, email) {
  try {
    const response = await fetch(`/admin/api/clients/${clientId}/purchases`);
    const result = await response.json();

    if (!result.success) {
      alert('Error loading client progress');
      return;
    }

    const courses = result.courses || [];

    if (courses.length === 0) {
      alert(`${name} has no purchased courses yet.`);
      return;
    }

    // Create modal content
    let modalContent = `
      <div class="modal fade" id="clientProgressModal" tabindex="-1" aria-labelledby="clientProgressModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="clientProgressModalLabel">${name}'s Course Progress</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p><strong>Email:</strong> ${email}</p>
              <hr>
              <h6>Course Progress:</h6>
              <div class="table-responsive">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Progress</th>
                      <th>Status</th>
                      <th>Certificate</th>
                    </tr>
                  </thead>
                  <tbody>
    `;

    courses.forEach(course => {
      const progress = course.progress || { total: 0, completed: 0, percentage: 0, isCompleted: false };
      const statusBadge = progress.isCompleted
        ? '<span class="badge badge-success">Completed</span>'
        : `<span class="badge badge-warning">In Progress</span>`;
      const certificateBadge = progress.isCompleted
        ? '<span class="badge badge-info">✓ Has Certificate</span>'
        : '<span class="text-muted">-</span>';

      modalContent += `
        <tr>
          <td><strong>${course.course_title}</strong></td>
          <td>
            <div style="min-width: 200px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <small>${progress.completed}/${progress.total} lessons</small>
                <small><strong>${progress.percentage}%</strong></small>
              </div>
              <div class="progress" style="height: 10px;">
                <div class="progress-bar" role="progressbar" style="width: ${progress.percentage}%; background: ${progress.isCompleted ? 'linear-gradient(135deg, #10b981, #34d399)' : 'linear-gradient(135deg, #7b09cd, #0d00ff)'};" 
                     aria-valuenow="${progress.percentage}" aria-valuemin="0" aria-valuemax="100"></div>
              </div>
            </div>
          </td>
          <td>${statusBadge}</td>
          <td>${certificateBadge}</td>
        </tr>
      `;
    });

    modalContent += `
                  </tbody>
                </table>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('clientProgressModal');
    if (existingModal) {
      existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalContent);

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('clientProgressModal'));
    modal.show();

    // Remove modal from DOM when hidden
    document.getElementById('clientProgressModal').addEventListener('hidden.bs.modal', function () {
      this.remove();
    });

  } catch (error) {
    console.error('Error loading client progress:', error);
    alert('Error loading client progress');
  }
}

async function deleteClient(clientId) {
  if (!confirm('Are you sure you want to delete this client?')) return;

  try {
    const response = await fetch(`/admin/api/clients/${clientId}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (result.success) {
      await loadClients();
    } else {
      alert(result.message || 'Failed to delete client');
    }
  } catch (error) {
    console.error('Error deleting client:', error);
    alert('Error connecting to the server.');
  }
}

// (Redundant block removed)


// Dashboard Stats
async function loadDashboardStats() {
  try {
    const response = await fetch('/admin/api/stats');
    const result = await response.json();

    if (result.success) {
      const stats = result.stats;
      // English version
      const totalUsersEl = document.getElementById('totalUsers');
      const totalCoursesEl = document.getElementById('totalCourses');
      const totalPurchasesEl = document.getElementById('totalPurchases');
      const totalEarningsEl = document.getElementById('totalEarnings');

      if (totalUsersEl) totalUsersEl.textContent = stats.totalUsers || 0;
      if (totalCoursesEl) totalCoursesEl.textContent = stats.totalCourses || 0;
      if (totalPurchasesEl) totalPurchasesEl.textContent = stats.totalPurchases || 0;
      if (totalEarningsEl) totalEarningsEl.textContent = (stats.totalRevenue || 0).toFixed(2) + ' DA';

      // Arabic version
      const totalUsersArEl = document.getElementById('totalUsersAr');
      const totalCoursesArEl = document.getElementById('totalCoursesAr');
      const totalPurchasesArEl = document.getElementById('totalPurchasesAr');
      const totalEarningsArEl = document.getElementById('totalEarningsAr');

      if (totalUsersArEl) totalUsersArEl.textContent = stats.totalUsers || 0;
      if (totalCoursesArEl) totalCoursesArEl.textContent = stats.totalCourses || 0;
      if (totalPurchasesArEl) totalPurchasesArEl.textContent = stats.totalPurchases || 0;
      if (totalEarningsArEl) totalEarningsArEl.textContent = (stats.totalRevenue || 0).toFixed(2) + ' دج';
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
  document.getElementById('editCourseId').value = '';
  document.getElementById('existingImageUrl').value = '';
  document.getElementById('addCourseModalLabel').textContent = 'Add New Course';
  const submitBtn = document.querySelector('#addCourseForm button[type="submit"]');
  if (submitBtn) submitBtn.textContent = 'Save Course';

  // Reset image preview
  const imagePreview = document.getElementById('imagePreview');
  const courseImageInput = document.getElementById('courseImage');
  if (imagePreview) imagePreview.style.display = 'none';
  if (courseImageInput) courseImageInput.setAttribute('required', 'required');

  const modal = new bootstrap.Modal(document.getElementById('addCourseModal'));
  modal.show();
}

async function editCourse(courseId) {
  try {
    const response = await fetch(`/admin/api/courses/${courseId}`);
    const result = await response.json();

    if (result.success) {
      const course = result.course;
      document.getElementById('editCourseId').value = courseId;
      document.getElementById('courseTitle').value = course.title;
      document.getElementById('courseDescription').value = course.description;
      // Handle image for edit mode
      const existingImageUrl = document.getElementById('existingImageUrl');
      const imagePreview = document.getElementById('imagePreview');
      const previewImg = document.getElementById('previewImg');
      const courseImageInput = document.getElementById('courseImage');

      if (existingImageUrl) {
        existingImageUrl.value = course.thumbnail_url;
      }

      // Show existing image preview
      if (imagePreview && previewImg && course.thumbnail_url) {
        previewImg.src = course.thumbnail_url;
        imagePreview.style.display = 'block';
      }

      // Make image input optional for edit (not required)
      if (courseImageInput) {
        courseImageInput.removeAttribute('required');
      }
      document.getElementById('coursePrice').value = course.price;
      document.getElementById('durationHours').value = course.duration_hours;
      document.getElementById('courseCategory').value = course.level || '';
      document.getElementById('previewVideoUrl').value = course.preview_video_url || '';
      document.getElementById('courseSkills').value = course.skills || '';
      document.getElementById('isPublished').value = course.is_published ? 'publish' : 'draft';

      document.getElementById('addCourseModalLabel').textContent = 'Edit Course';
      const submitBtn = document.querySelector('#addCourseForm button[type="submit"]');
      if (submitBtn) submitBtn.textContent = 'Update Course';

      const modal = new bootstrap.Modal(document.getElementById('addCourseModal'));
      modal.show();
    } else {
      alert('Failed to load course data');
    }
  } catch (error) {
    console.error('Error loading course:', error);
    alert('Error loading course data');
  }
}

// Certificates Management
async function loadCertificates() {
  try {
    const response = await fetch('/admin/api/certificates');
    const result = await response.json();

    if (result.success) {
      renderCertificates(result.certificates);
    } else {
      console.error('Failed to load certificates');
    }
  } catch (error) {
    console.error('Error loading certificates:', error);
  }
}

function renderCertificates(certificates) {
  const tbody = document.getElementById('certificatesTableBody');

  if (!certificates || certificates.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">No certificates issued yet.</td></tr>';
    return;
  }

  tbody.innerHTML = certificates.map(cert => `
    <tr>
      <td><strong>#${cert.id}</strong></td>
      <td>${cert.client_name || 'Unknown'}</td>
      <td>${cert.course_title || 'Unknown Course'}</td>
      <td><span class="badge badge-info">${cert.course_category || 'N/A'}</span></td>
      <td>${new Date(cert.date_issued).toLocaleDateString()}</td>
      <td>
        <a href="${cert.certificate_url}" target="_blank" class="btn btn-sm btn-primary" title="View Certificate">
          <span class="material-symbols-outlined">visibility</span>
        </a>
        <button class="btn btn-sm btn-danger" onclick="deleteCertificate(${cert.id})" title="Delete">
          <span class="material-symbols-outlined">delete</span>
        </button>
      </td>
    </tr>
  `).join('');
}

async function openIssueCertificateModal() {
  // Load clients
  try {
    const clientsResponse = await fetch('/admin/api/clients');
    const clientsResult = await clientsResponse.json();

    if (clientsResult.success) {
      const clientSelect = document.getElementById('certificateClientSelect');
      clientSelect.innerHTML = '<option value="">-- Select Client --</option>' +
        clientsResult.clients.map(client =>
          `<option value="${client.id}">${client.fullname} (${client.email})</option>`
        ).join('');
    }

    // Load courses
    const coursesResponse = await fetch('/admin/api/courses');
    const coursesResult = await coursesResponse.json();

    if (coursesResult.success) {
      const courseSelect = document.getElementById('certificateCourseSelect');
      courseSelect.innerHTML = '<option value="">-- Select Course --</option>' +
        coursesResult.courses.map(course =>
          `<option value="${course.course_id}">${course.title}</option>`
        ).join('');
    }

    const modal = new bootstrap.Modal(document.getElementById('issueCertificateModal'));
    modal.show();
  } catch (error) {
    console.error('Error loading data:', error);
    alert('Error loading data');
  }

  // Setup form submission
  const form = document.getElementById('issueCertificateForm');
  form.onsubmit = async (e) => {
    e.preventDefault();
    const clientId = document.getElementById('certificateClientSelect').value;
    const courseId = document.getElementById('certificateCourseSelect').value;
    const message = document.getElementById('messageCertificate');

    if (!clientId || !courseId) {
      message.textContent = 'Please select both client and course';
      message.style.display = 'block';
      message.style.color = 'red';
      return;
    }

    try {
      const response = await fetch('/admin/api/certificates/issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId, courseId })
      });

      const result = await response.json();
      message.style.display = 'block';
      message.style.color = result.success ? 'green' : 'red';
      message.textContent = result.message;

      if (result.success) {
        setTimeout(() => {
          modal.hide();
          loadCertificates();
        }, 1500);
      }
    } catch (error) {
      console.error('Error issuing certificate:', error);
      message.style.display = 'block';
      message.style.color = 'red';
      message.textContent = 'Error issuing certificate';
    }
  };
}

async function deleteCertificate(certId) {
  if (!confirm('Are you sure you want to delete this certificate?')) return;

  try {
    const response = await fetch(`/admin/api/certificates/${certId}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (result.success) {
      await loadCertificates();
    } else {
      alert(result.message || 'Failed to delete certificate');
    }
  } catch (error) {
    console.error('Error deleting certificate:', error);
    alert('Error connecting to the server.');
  }
}

// Session check
async function checkSession() {
  try {
    const response = await fetch('/api/check-session', {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok || response.status === 401) {
      window.location.replace('/login');
      return false;
    }
    if (result.success) {
      renderCertificates(result.certificates);
    } else {
      console.error('Failed to load certificates');
    }
  } catch (error) {
    console.error('Error loading certificates:', error);
  }
}

function renderCertificates(certificates) {
  const tbody = document.getElementById('certificatesTableBody');

  if (!certificates || certificates.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">No certificates issued yet.</td></tr>';
    return;
  }

  tbody.innerHTML = certificates.map(cert => `
    <tr>
      <td><strong>#${cert.id}</strong></td>
      <td>${cert.client_name || 'Unknown'}</td>
      <td>${cert.course_title || 'Unknown Course'}</td>
      <td><span class="badge badge-info">${cert.course_category || 'N/A'}</span></td>
      <td>${new Date(cert.date_issued).toLocaleDateString()}</td>
      <td>
        <a href="${cert.certificate_url}" target="_blank" class="btn btn-sm btn-primary" title="View Certificate">
          <span class="material-symbols-outlined">visibility</span>
        </a>
        <button class="btn btn-sm btn-danger" onclick="deleteCertificate(${cert.id})" title="Delete">
          <span class="material-symbols-outlined">delete</span>
        </button>
      </td>
    </tr>
  `).join('');
}

async function openIssueCertificateModal() {
  // Load clients
  try {
    const clientsResponse = await fetch('/admin/api/clients');
    const clientsResult = await clientsResponse.json();

    if (clientsResult.success) {
      const clientSelect = document.getElementById('certificateClientSelect');
      clientSelect.innerHTML = '<option value="">-- Select Client --</option>' +
        clientsResult.clients.map(client =>
          `<option value="${client.id}">${client.fullname} (${client.email})</option>`
        ).join('');
    }

    // Load courses
    const coursesResponse = await fetch('/admin/api/courses');
    const coursesResult = await coursesResponse.json();

    if (coursesResult.success) {
      const courseSelect = document.getElementById('certificateCourseSelect');
      courseSelect.innerHTML = '<option value="">-- Select Course --</option>' +
        coursesResult.courses.map(course =>
          `<option value="${course.course_id}">${course.title}</option>`
        ).join('');
    }

    const modal = new bootstrap.Modal(document.getElementById('issueCertificateModal'));
    modal.show();
  } catch (error) {
    console.error('Error loading data:', error);
    alert('Error loading data');
  }

  // Setup form submission
  const form = document.getElementById('issueCertificateForm');
  form.onsubmit = async (e) => {
    e.preventDefault();
    const clientId = document.getElementById('certificateClientSelect').value;
    const courseId = document.getElementById('certificateCourseSelect').value;
    const message = document.getElementById('messageCertificate');

    if (!clientId || !courseId) {
      message.textContent = 'Please select both client and course';
      message.style.display = 'block';
      message.style.color = 'red';
      return;
    }

    try {
      const response = await fetch('/admin/api/certificates/issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId, courseId })
      });

      const result = await response.json();
      message.style.display = 'block';
      message.style.color = result.success ? 'green' : 'red';
      message.textContent = result.message;

      if (result.success) {
        setTimeout(() => {
          modal.hide();
          loadCertificates();
        }, 1500);
      }
    } catch (error) {
      console.error('Error issuing certificate:', error);
      message.style.display = 'block';
      message.style.color = 'red';
      message.textContent = 'Error issuing certificate';
    }
  };
}

async function deleteCertificate(certId) {
  if (!confirm('Are you sure you want to delete this certificate?')) return;

  try {
    const response = await fetch(`/admin/api/certificates/${certId}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (result.success) {
      await loadCertificates();
    } else {
      alert(result.message || 'Failed to delete certificate');
    }
  } catch (error) {
    console.error('Error deleting certificate:', error);
    alert('Error connecting to the server.');
  }
}

// Session check
async function checkSession() {
  try {
    const response = await fetch('/api/check-session', {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok || response.status === 401) {
      window.location.replace('/login');
      return false;
    }
    return true;
  } catch (error) {
    console.error('Session check failed:', error);
    window.location.replace('/login');
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

// ======== Free/Paid Toggle Functions ========
async function toggleCourseFree(courseId, currentIsFree) {
  const action = currentIsFree ? 'paid' : 'free';
  const message = currentIsFree
    ? 'Are you sure you want to make this course paid? It will not automatically affect existing chapters and lessons.'
    : 'Are you sure you want to make this course FREE? All chapters and lessons will also become free.';

  if (!confirm(message)) return;

  try {
    const response = await fetch(`/admin/api/courses/${courseId}/toggle-free`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isFree: !currentIsFree })
    });

    const result = await response.json();

    if (result.success) {
      alert(result.message || `Course set to ${action} successfully!`);
      // Reload current view
      if (currentCourseId) {
        await loadChapters(currentCourseId);
      }
      location.reload(); // Refresh to update the course list
    } else {
      alert(result.message || `Failed to set course to ${action}`);
    }
  } catch (error) {
    console.error('Error toggling course free status:', error);
    alert('Error connecting to the server.');
  }
}

async function toggleChapterFree(chapterId, currentIsFree) {
  const action = currentIsFree ? 'paid' : 'free';
  const message = currentIsFree
    ? 'Are you sure you want to make this chapter paid? It will not automatically affect existing lessons.'
    : 'Are you sure you want to make this chapter FREE? All its lessons will also become free.';

  if (!confirm(message)) return;

  try {
    const response = await fetch(`/admin/api/chapters/${chapterId}/toggle-free`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isFree: !currentIsFree })
    });

    const result = await response.json();

    if (result.success) {
      alert(result.message || `Chapter set to ${action} successfully!`);
      // Reload chapters and lessons
      if (currentCourseId) {
        await loadChapters(currentCourseId);
      }
      if (currentChapterId) {
        await loadLessons(currentChapterId);
      }
    } else {
      alert(result.message || `Failed to set chapter to ${action}`);
    }
  } catch (error) {
    console.error('Error toggling chapter free status:', error);
    alert('Error connecting to the server.');
  }
}

async function toggleLessonFree(lessonId, currentIsFree) {
  const action = currentIsFree ? 'paid' : 'free';
  const message = `Are you sure you want to make this lesson ${action}?`;

  if (!confirm(message)) return;

  try {
    const response = await fetch(`/admin/api/lessons/${lessonId}/toggle-free`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isFree: !currentIsFree })
    });

    const result = await response.json();

    if (result.success) {
      alert(result.message || `Lesson set to ${action} successfully!`);
      // Reload lessons
      if (currentChapterId) {
        await loadLessons(currentChapterId);
      }
    } else {
      alert(result.message || `Failed to set lesson to ${action}`);
    }
  } catch (error) {
    console.error('Error toggling lesson free status:', error);
    alert('Error connecting to the server.');
  }
}

// ========= PURCHASES MANAGEMENT =========

// Global variable to store all purchases for filtering
let allPurchasesData = [];

// Search purchases
function searchPurchases() {
  const searchTerm = document.getElementById('purchaseSearch').value.toLowerCase();
  const rows = document.querySelectorAll('#purchasesTableBody tr');

  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(searchTerm) ? '' : 'none';
  });
}

// Export purchases to Excel (CSV format)
function exportPurchases() {
  const rows = document.querySelectorAll('#purchasesTableBody tr');

  if (rows.length === 0 || (rows.length === 1 && rows[0].textContent.includes('No purchases'))) {
    alert('No purchases to export');
    return;
  }

  // Create CSV content
  let csvContent = "data:text/csv;charset=utf-8,";

  // Add headers
  csvContent += "Purchase ID,Client Name,Course,Amount,Date,Status\n";

  // Add data rows
  rows.forEach(row => {
    if (row.style.display !== 'none') {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 6) {
        const rowData = [
          cells[0].textContent.trim(), // Purchase ID
          cells[1].textContent.trim(), // Client Name
          cells[2].textContent.trim(), // Course
          cells[3].textContent.trim(), // Amount
          cells[4].textContent.trim(), // Date
          cells[5].textContent.trim()  // Status
        ];
        csvContent += rowData.map(cell => `"${cell}"`).join(',') + "\n";
      }
    }
  });

  // Create download link
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `purchases_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  alert('Purchases exported successfully!');
}

// View purchase details in modal
async function viewPurchaseDetails(purchaseId, clientName, courseName, amount, date, status) {
  const modalContent = `
    <div style="padding: 20px;">
      <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
        <h4 style="color: #2563eb; margin: 0 0 15px 0;">
          <span class="material-symbols-outlined" style="vertical-align: middle;">receipt_long</span>
          Purchase #${purchaseId}
        </h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
          <div>
            <p style="margin: 0; color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase;">Client</p>
            <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: 600; color: #1f2937;">${clientName}</p>
          </div>
          <div>
            <p style="margin: 0; color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase;">Course</p>
            <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: 600; color: #1f2937;">${courseName}</p>
          </div>
          <div>
            <p style="margin: 0; color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase;">Amount</p>
            <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: 700; color: #10b981;">${amount}</p>
          </div>
          <div>
            <p style="margin: 0; color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase;">Date</p>
            <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: 600; color: #1f2937;">${date}</p>
          </div>
          <div>
            <p style="margin: 0; color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase;">Status</p>
            <p style="margin: 5px 0 0 0;">
              <span class="badge ${status === 'Paid' ? 'badge-success' : 'badge-warning'}" style="font-size: 14px; padding: 6px 12px;">
                ${status}
              </span>
            </p>
          </div>
        </div>
      </div>
      
      <div style="background: white; padding: 20px; border-radius: 12px; border: 2px solid #e5e7eb;">
        <h5 style="color: #1f2937; margin: 0 0 15px 0;">
          <span class="material-symbols-outlined" style="vertical-align: middle; color: #2563eb;">info</span>
          Additional Information
        </h5>
        <div style="display: grid; gap: 10px;">
          <div style="display: flex; justify-content: space-between; padding: 10px; background: #f9fafb; border-radius: 8px;">
            <span style="color: #6b7280; font-weight: 600;">Purchase ID:</span>
            <span style="color: #1f2937; font-weight: 600;">#${purchaseId}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 10px; background: #f9fafb; border-radius: 8px;">
            <span style="color: #6b7280; font-weight: 600;">Payment Method:</span>
            <span style="color: #1f2937;">Manual/Admin</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 10px; background: #f9fafb; border-radius: 8px;">
            <span style="color: #6b7280; font-weight: 600;">Transaction Date:</span>
            <span style="color: #1f2937;">${date}</span>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('purchaseDetailsContent').innerHTML = modalContent;
  const modal = new bootstrap.Modal(document.getElementById('purchaseDetailsModal'));
  modal.show();
}

// Toggle purchase payment status
async function togglePurchaseStatus(purchaseId, currentStatus) {
  const newStatus = currentStatus === 1 ? 0 : 1;
  const statusText = newStatus === 1 ? 'Paid' : 'Unpaid';

  if (!confirm(`Are you sure you want to mark this purchase as ${statusText}?`)) {
    return;
  }

  try {
    const response = await fetch(`/admin/api/purchases/${purchaseId}/toggle-status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paid: newStatus })
    });

    const result = await response.json();

    if (result.success) {
      alert(`Purchase marked as ${statusText} successfully!`);
      // Reload purchases
      if (typeof loadPurchases === 'function') {
        loadPurchases();
      } else {
        location.reload();
      }
    } else {
      alert(result.message || 'Failed to update purchase status');
    }
  } catch (error) {
    console.error('Error toggling purchase status:', error);
    alert('Error connecting to the server.');
  }
}

// Delete purchase
async function deletePurchase(purchaseId) {
  if (!confirm('Are you sure you want to delete this purchase? This action cannot be undone.')) {
    return;
  }

  try {
    const response = await fetch(`/admin/api/purchases/${purchaseId}`, {
      method: 'DELETE'
    });

    const result = await response.json();

    if (result.success) {
      alert('Purchase deleted successfully!');
      // Reload purchases
      if (typeof loadPurchases === 'function') {
        loadPurchases();
      } else {
        location.reload();
      }
    } else {
      alert(result.message || 'Failed to delete purchase');
    }
  } catch (error) {
    console.error('Error deleting purchase:', error);
    alert('Error connecting to the server.');
  }
}

// Filter purchases by date range
function filterPurchases(filterType) {
  // Update active button
  document.querySelectorAll('.btn-filter').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');

  const rows = document.querySelectorAll('#purchasesTableBody tr');
  const now = new Date();

  rows.forEach(row => {
    const dateCell = row.querySelector('td:nth-child(5)');
    if (!dateCell) return;

    const dateText = dateCell.textContent.trim();
    const purchaseDate = new Date(dateText);

    let showRow = false;

    switch (filterType) {
      case 'all':
        showRow = true;
        break;

      case 'today':
        showRow = purchaseDate.toDateString() === now.toDateString();
        break;

      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        showRow = purchaseDate >= weekAgo;
        break;

      case 'month':
        const monthAgo = new Date(now);
        monthAgo.setMonth(now.getMonth() - 1);
        showRow = purchaseDate >= monthAgo;
        break;
    }

    row.style.display = showRow ? '' : 'none';
  });

  // Update counts after filtering
  updatePurchaseStats();
}

// Update purchase statistics
function updatePurchaseStats() {
  const visibleRows = Array.from(document.querySelectorAll('#purchasesTableBody tr')).filter(
    row => row.style.display !== 'none' && !row.textContent.includes('No purchases')
  );

  const totalCount = visibleRows.length;
  let totalRevenue = 0;
  let todayCount = 0;
  const today = new Date().toDateString();

  visibleRows.forEach(row => {
    const amountCell = row.querySelector('td:nth-child(4)');
    const dateCell = row.querySelector('td:nth-child(5)');

    if (amountCell) {
      const amount = parseFloat(amountCell.textContent.replace(/[^\d.]/g, ''));
      if (!isNaN(amount)) {
        totalRevenue += amount;
      }
    }

    if (dateCell) {
      const purchaseDate = new Date(dateCell.textContent.trim());
      if (purchaseDate.toDateString() === today) {
        todayCount++;
      }
    }
  });

  // Update UI
  const totalPurchasesEl = document.getElementById('totalPurchasesCount');
  const totalRevenueEl = document.getElementById('totalRevenueAmount');
  const todayPurchasesEl = document.getElementById('todayPurchasesCount');

  if (totalPurchasesEl) totalPurchasesEl.textContent = totalCount;
  if (totalRevenueEl) totalRevenueEl.textContent = totalRevenue.toFixed(2) + ' DA';
  if (todayPurchasesEl) todayPurchasesEl.textContent = todayCount;
}

// Load purchases data (to be called when Purchases section is shown)
async function loadPurchases() {
  try {
    const response = await fetch('/admin/api/purchases');
    const result = await response.json();

    if (result.success) {
      allPurchasesData = result.purchases || [];
      renderPurchases(allPurchasesData);
      updatePurchaseStats();
    } else {
      console.error('Failed to load purchases');
    }
  } catch (error) {
    console.error('Error loading purchases:', error);
  }
}

// Render purchases table
function renderPurchases(purchases) {
  const tbody = document.getElementById('purchasesTableBody');

  if (!purchases || purchases.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">No purchases found.</td></tr>';
    return;
  }

  tbody.innerHTML = purchases.map(purchase => {
    const statusBadge = purchase.paid === 1
      ? '<span class="badge badge-success">Paid</span>'
      : '<span class="badge badge-warning">Unpaid</span>';

    const date = new Date(purchase.purchase_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    return `
      <tr>
        <td data-label="Purchase ID">#${purchase.id}</td>
        <td data-label="Client Name"><strong>${purchase.client_name || 'N/A'}</strong></td>
        <td data-label="Course">${purchase.course_title || 'N/A'}</td>
        <td data-label="Amount"><strong>${purchase.price || 0} DA</strong></td>
        <td data-label="Date">${date}</td>
        <td data-label="Status">${statusBadge}</td>
        <td data-label="Actions">
          <button class="btn btn-sm btn-info" onclick="viewPurchaseDetails(${purchase.id}, '${(purchase.client_name || 'N/A').replace(/'/g, "\\'")}', '${(purchase.course_title || 'N/A').replace(/'/g, "\\'")}', '${purchase.price || 0} DA', '${date}', '${purchase.paid === 1 ? 'Paid' : 'Unpaid'}')" title="View Details">
            <span class="material-symbols-outlined">visibility</span>
          </button>
          <button class="btn btn-sm ${purchase.paid === 1 ? 'btn-warning' : 'btn-success'}" onclick="togglePurchaseStatus(${purchase.id}, ${purchase.paid})" title="Toggle Status">
            <span class="material-symbols-outlined">${purchase.paid === 1 ? 'cancel' : 'check_circle'}</span>
          </button>
          <button class="btn btn-sm btn-danger" onclick="deletePurchase(${purchase.id})" title="Delete">
            <span class="material-symbols-outlined">delete</span>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// ========= CLIENT MANAGEMENT ENHANCEMENTS =========

// Update client statistics
function updateClientStats() {
  const rows = Array.from(document.querySelectorAll('#clientsTableBody tr')).filter(
    row => row.style.display !== 'none' && !row.textContent.includes('No clients')
  );

  const totalClients = rows.length;
  const payingClients = rows.filter(row => row.getAttribute('data-client-type') === 'paying').length;
  const freeClients = rows.filter(row => row.getAttribute('data-client-type') === 'free').length;
  const activeClients = rows.filter(row => row.getAttribute('data-client-active') === 'true').length;

  // Update UI
  const totalEl = document.getElementById('totalClientsCount');
  const payingEl = document.getElementById('payingClientsCount');
  const freeEl = document.getElementById('freeClientsCount');
  const activeEl = document.getElementById('activeClientsCount');

  if (totalEl) totalEl.textContent = totalClients;
  if (payingEl) payingEl.textContent = payingClients;
  if (freeEl) freeEl.textContent = freeClients;
  if (activeEl) activeEl.textContent = activeClients;
}

// Filter clients by type
function filterClientsByType(type) {
  // Update active button
  document.querySelectorAll('.btn-filter').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');

  const rows = document.querySelectorAll('#clientsTableBody tr');

  rows.forEach(row => {
    const clientType = row.getAttribute('data-client-type');
    const isActive = row.getAttribute('data-client-active') === 'true';

    let showRow = false;

    switch (type) {
      case 'all':
        showRow = true;
        break;
      case 'paying':
        showRow = clientType === 'paying';
        break;
      case 'free':
        showRow = clientType === 'free';
        break;
      case 'active':
        showRow = isActive;
        break;
    }

    row.style.display = showRow ? '' : 'none';
  });

  updateClientStats();
}

// Export clients to CSV
function exportClients() {
  const rows = document.querySelectorAll('#clientsTableBody tr');

  if (rows.length === 0 || (rows.length === 1 && rows[0].textContent.includes('No clients'))) {
    alert('No clients to export');
    return;
  }

  // Create CSV content
  let csvContent = "data:text/csv;charset=utf-8,";

  // Add headers
  csvContent += "Name,Email,Type,Courses,Status\n";

  // Add data rows
  rows.forEach(row => {
    if (row.style.display !== 'none') {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 6) {
        const name = cells[0].textContent.trim();
        const email = cells[1].textContent.trim();
        const type = cells[2].textContent.trim().replace(/[💳🆓]/g, '');
        const courses = cells[3].textContent.trim();
        const status = cells[5].textContent.trim().replace(/[🟢⚪]/g, '');

        csvContent += `"${name}","${email}","${type}","${courses}","${status}"\n`;
      }
    }
  });

  // Create download link
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `clients_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  alert('Clients exported successfully!');
}

// View client details in modal
function viewClientDetails(clientId, clientName, clientEmail, totalCourses, overallProgress, membershipTier, membershipExpiry) {
  const clientType = totalCourses > 0 ? 'Paying Customer' : 'Free User';
  const clientStatus = overallProgress > 0 ? 'Active Learner' : 'Inactive';

  const membershipBadgeText = membershipTier === 'VIP' ? '👑 VIP' : (membershipTier === 'Pro' ? '💎 PRO' : '🌱 Free');
  const membershipClass = membershipTier === 'VIP' ? 'bg-warning text-dark' : (membershipTier === 'Pro' ? 'bg-primary' : 'bg-secondary');

  const modalContent = `
    <div style="padding: 20px;">
      <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 25px; border-radius: 12px; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 20px;">
          <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #3b82f6, #06b6d4); display: flex; align-items: center; justify-content: center; color: white; font-size: 36px; font-weight: 700;">
            ${clientName.charAt(0).toUpperCase()}
          </div>
          <div style="flex: 1;">
            <h3 style="margin: 0 0 5px 0; color: #1f2937;">${clientName}</h3>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">${clientEmail}</p>
            <div style="margin-top: 10px; display: flex; gap: 10px;">
              <span class="badge ${totalCourses > 0 ? 'badge-success' : 'badge-secondary'}" style="font-size: 12px;">
                ${totalCourses > 0 ? '💳 Paying Customer' : '🆓 Free User'}
              </span>
              <span class="badge ${overallProgress > 0 ? 'badge-success' : 'badge-secondary'}" style="font-size: 12px;">
                ${overallProgress > 0 ? '🟢 Active' : '⚪ Inactive'}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
        <div style="background: white; padding: 20px; border-radius: 12px; border: 2px solid #e5e7eb;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
            <span class="material-symbols-outlined" style="color: #3b82f6; font-size: 28px;">school</span>
            <div>
              <p style="margin: 0; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase;">Total Courses</p>
              <h4 style="margin: 5px 0 0 0; color: #1f2937; font-size: 24px;">${totalCourses}</h4>
            </div>
          </div>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 12px; border: 2px solid #e5e7eb;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
            <span class="material-symbols-outlined" style="color: #10b981; font-size: 28px;">trending_up</span>
            <div>
              <p style="margin: 0; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase;">Progress</p>
              <h4 style="margin: 5px 0 0 0; color: #1f2937; font-size: 24px;">${overallProgress}%</h4>
            </div>
          </div>
        </div>

        <div style="background: white; padding: 20px; border-radius: 12px; border: 2px solid #e5e7eb;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
            <span class="material-symbols-outlined" style="color: #7b09cd; font-size: 28px;">workspace_premium</span>
            <div>
              <p style="margin: 0; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase;">Membership</p>
              <h4 style="margin: 5px 0 0 0; color: #1f2937; font-size: 18px;">
                <span class="badge ${membershipClass}">${membershipBadgeText}</span>
              </h4>
              ${membershipExpiry !== 'Never' ? `<p style="margin: 5px 0 0 0; font-size: 10px; color: #6b7280;">Expires: ${membershipExpiry}</p>` : ''}
            </div>
          </div>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 12px; border: 2px solid #e5e7eb;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
            <span class="material-symbols-outlined" style="color: #f59e0b; font-size: 28px;">person</span>
            <div>
              <p style="margin: 0; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase;">Status</p>
              <h4 style="margin: 5px 0 0 0; color: #1f2937; font-size: 16px;">${clientStatus}</h4>
            </div>
          </div>
        </div>
      </div>
      
      <div style="background: white; padding: 20px; border-radius: 12px; border: 2px solid #e5e7eb;">
        <h5 style="color: #1f2937; margin: 0 0 15px 0;">
          <span class="material-symbols-outlined" style="vertical-align: middle; color: #2563eb;">info</span>
          Account Information
        </h5>
        <div style="display: grid; gap: 10px;">
          <div style="display: flex; justify-content: space-between; padding: 10px; background: #f9fafb; border-radius: 8px;">
            <span style="color: #6b7280; font-weight: 600;">Client ID:</span>
            <span style="color: #1f2937; font-weight: 600;">#${clientId}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 10px; background: #f9fafb; border-radius: 8px;">
            <span style="color: #6b7280; font-weight: 600;">Email:</span>
            <span style="color: #1f2937;">${clientEmail}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 10px; background: #f9fafb; border-radius: 8px;">
            <span style="color: #6b7280; font-weight: 600;">Account Type:</span>
            <span style="color: #1f2937;">${clientType}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 10px; background: #f9fafb; border-radius: 8px;">
            <span style="color: #6b7280; font-weight: 600;">Learning Status:</span>
            <span style="color: #1f2937;">${clientStatus}</span>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('clientDetailsContent').innerHTML = modalContent;
  const modal = new bootstrap.Modal(document.getElementById('clientDetailsModal'));
  modal.show();
}
