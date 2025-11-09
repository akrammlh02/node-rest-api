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
    tbody.innerHTML = '<tr><td colspan="4" class="text-center">No chapters yet. Add one above.</td></tr>';
    return;
  }

  tbody.innerHTML = chapters.map(chapter => `
    <tr>
      <td class="text-center"><strong>${chapter.order}</strong></td>
      <td><strong>${chapter.title}</strong></td>
      <td class="text-center chapter-lesson-count-${chapter.id}">0</td>
      <td>
        <button class="btn btn-sm btn-primary" onclick="manageChapter(${chapter.id})" title="Manage Lessons">
          <span class="material-symbols-outlined">settings</span>
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

async function quickAddLesson() {
  const title = document.getElementById('quickLessonTitle').value.trim();
  const videoUrl = document.getElementById('quickLessonVideoUrl').value.trim();

  if (!title) {
    alert('Please enter a lesson title');
    return;
  }

  if (!videoUrl) {
    alert('Please enter a video URL');
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
    tbody.innerHTML = '<tr><td colspan="4" class="text-center">No lessons yet. Add one above.</td></tr>';
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
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">No clients registered yet.</td></tr>';
    return;
  }

  tbody.innerHTML = clients.map(client => {
    // Calculate overall progress
    let totalCourses = client.purchasedCourses.length;
    let completedCourses = client.purchasedCourses.filter(c => c.progress && c.progress.isCompleted).length;
    let overallProgress = totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;
    
    // Build progress display
    let progressHTML = '';
    if (totalCourses === 0) {
      progressHTML = '<span class="text-muted">No courses</span>';
    } else {
      progressHTML = `
        <div style="min-width: 150px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
            <small><strong>${completedCourses}/${totalCourses}</strong> completed</small>
            <small><strong>${overallProgress}%</strong></small>
          </div>
          <div class="progress" style="height: 8px; background-color: #e9ecef; border-radius: 4px; overflow: hidden;">
            <div class="progress-bar" role="progressbar" style="width: ${overallProgress}%; background: linear-gradient(135deg, #10b981, #34d399);" 
                 aria-valuenow="${overallProgress}" aria-valuemin="0" aria-valuemax="100"></div>
          </div>
        </div>
      `;
    }
    
    return `
      <tr>
        <td><strong>${client.fullname}</strong></td>
        <td>${client.email}</td>
        <td>
          <span class="badge badge-info">${totalCourses} courses</span>
          ${totalCourses > 0 ? `<br><small style="font-size: 11px; color: #666;">${client.purchasedCourses.map(c => c.course_title).slice(0, 2).join(', ')}${totalCourses > 2 ? '...' : ''}</small>` : ''}
        </td>
        <td>${progressHTML}</td>
        <td><span class="badge badge-success">Active</span></td>
        <td>
          <button class="btn btn-sm btn-info" onclick="viewClientProgress(${client.id}, '${client.fullname}', '${client.email}')" title="View Progress">
            <span class="material-symbols-outlined">analytics</span>
          </button>
          <button class="btn btn-sm btn-primary" onclick="viewClient(${client.id}, '${client.fullname}', '${client.email}')" title="View Details">
            <span class="material-symbols-outlined">visibility</span>
          </button>
          <button class="btn btn-sm btn-success" onclick="addCourseToClient(${client.id}, '${client.fullname}')" title="Add Course">
            <span class="material-symbols-outlined">add</span>
          </button>
          <button class="btn btn-sm btn-warning" onclick="removeCourseFromClient(${client.id}, '${client.fullname}')" title="Remove Course">
            <span class="material-symbols-outlined">remove</span>
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteClient(${client.id})" title="Delete">
            <span class="material-symbols-outlined">delete</span>
          </button>
        </td>
      </tr>
    `;
  }).join('');
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
    document.getElementById('clientProgressModal').addEventListener('hidden.bs.modal', function() {
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
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">No purchases yet.</td></tr>';
    document.getElementById('totalPurchases').textContent = '0';
    document.getElementById('totalRevenue').textContent = '0 DA';
    document.getElementById('todayPurchases').textContent = '0';
    return;
  }

  const totalPurchases = purchases.length;
  const totalRevenue = purchases
    .filter(p => p.paid === 1)
    .reduce((sum, p) => sum + parseFloat(p.price || 0), 0);
  const today = new Date().toISOString().split('T')[0];
  const todayPurchases = purchases.filter(p => p.purchase_date === today).length;

  document.getElementById('totalPurchases').textContent = totalPurchases;
  document.getElementById('totalRevenue').textContent = totalRevenue.toFixed(2) + ' DA';
  document.getElementById('todayPurchases').textContent = todayPurchases;

  tbody.innerHTML = purchases.map(purchase => `
    <tr>
      <td><strong>#${purchase.id}</strong></td>
      <td>${purchase.client_name || 'Unknown'}</td>
      <td>${purchase.course_title || 'Unknown Course'}</td>
      <td><strong>${purchase.price || 0} DA</strong></td>
      <td>${new Date(purchase.purchase_date).toLocaleDateString()}</td>
      <td><span class="badge ${purchase.paid === 1 ? 'badge-success' : 'badge-warning'}">${purchase.paid === 1 ? 'Paid' : 'Pending'}</span></td>
      <td>
        <button class="btn btn-sm btn-primary" onclick="viewPurchase(${purchase.id}, '${purchase.client_name || 'Unknown'}', '${purchase.course_title || 'Unknown'}', '${purchase.price || 0}', '${purchase.purchase_date}')" title="View Details">
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
  alert(`Purchase Details:\n\nID: #${purchaseId}\nClient: ${clientName}\nCourse: ${courseTitle}\nAmount: ${amount} DA\nDate: ${new Date(date).toLocaleDateString()}`);
}

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

