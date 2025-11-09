// Load dashboard statistics
async function loadDashboardStats() {
  try {
    const response = await fetch('/dashboard/api/stats');
    const result = await response.json();
    
    if (result.success) {
      const stats = result.stats;
      const enrolledEl = document.getElementById('enrolledCountStat');
      if (enrolledEl) enrolledEl.textContent = stats.enrolledCourses || 0;
      const enrolledEl2 = document.getElementById('enrolledCount');
      if (enrolledEl2) enrolledEl2.textContent = stats.enrolledCourses || 0;
      document.getElementById('completedCount').textContent = stats.completedCourses || 0;
      document.getElementById('certificateCount').textContent = stats.certificates || 0;
      document.getElementById('learningHours').textContent = stats.learningHours || 0;
    }
  } catch (error) {
    console.error('Error loading dashboard stats:', error);
  }
}

// Load course progress
async function loadCourseProgress() {
  try {
    const response = await fetch('/dashboard/api/progress');
    const result = await response.json();
    
    if (result.success && result.progress) {
      result.progress.forEach(courseProgress => {
        const progressBar = document.getElementById(`progress-bar-${courseProgress.course_id}`);
        const progressText = document.getElementById(`progress-${courseProgress.course_id}`);
        const progressBarMy = document.getElementById(`progress-bar-my-${courseProgress.course_id}`);
        const progressTextMy = document.getElementById(`progress-my-${courseProgress.course_id}`);
        
        if (progressBar) {
          progressBar.style.width = `${courseProgress.percentage}%`;
        }
        if (progressText) {
          progressText.textContent = `${courseProgress.percentage}%`;
        }
        if (progressBarMy) {
          progressBarMy.style.width = `${courseProgress.percentage}%`;
        }
        if (progressTextMy) {
          progressTextMy.textContent = `${courseProgress.percentage}%`;
        }
      });
    }
  } catch (error) {
    console.error('Error loading course progress:', error);
  }
}

// Load my courses
async function loadMyCourses() {
  try {
    const response = await fetch('/dashboard/api/my-courses');
    const result = await response.json();
    
    if (result.success && result.courses.length > 0) {
      const container = document.getElementById('myCoursesContainer');
      container.innerHTML = result.courses.map(course => `
        <div class="course-card-modern" data-course-id="${course.course_id}">
          <div class="course-image-wrapper">
            <img src="${course.thumbnail_url || '/images/front-end-1.jpg'}" alt="${course.title}" onerror="this.src='/images/front-end-1.jpg'">
            <div class="course-overlay">
              <a href="/course/course-view?id=${course.course_id}" class="btn-overlay">
                <span class="material-symbols-outlined">play_circle</span>
              </a>
            </div>
          </div>
          <div class="course-card-content">
            <div class="course-header">
              <h4>${course.title}</h4>
              <span class="course-badge">Active</span>
            </div>
            <p class="course-description">${course.description || ''}</p>
            <div class="course-meta-info">
              <span><span class="material-symbols-outlined">alarm</span> ${course.duration_hours || 0} hours</span>
              <span><span class="material-symbols-outlined">book_ribbon</span> Lessons</span>
            </div>
            <div class="course-progress-wrapper">
              <div class="progress-info">
                <span>Progress</span>
                <span class="progress-percentage" id="progress-my-${course.course_id}">0%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" id="progress-bar-my-${course.course_id}" style="width: 0%"></div>
              </div>
            </div>
            <div class="course-footer">
              <a href="/course/course-view?id=${course.course_id}" class="btn-continue-modern">
                <span class="material-symbols-outlined">play_arrow</span>
                Continue Learning
              </a>
            </div>
          </div>
        </div>
      `).join('');
      
      // Load progress after rendering
      loadCourseProgress();
    }
  } catch (error) {
    console.error('Error loading my courses:', error);
  }
}

// Load certificates
async function loadCertificates() {
  try {
    const response = await fetch('/dashboard/api/certificates');
    const result = await response.json();
    
    if (result.success) {
      renderCertificates(result.certificates);
    } else {
      console.error('Failed to load certificates');
      renderCertificates([]);
    }
  } catch (error) {
    console.error('Error loading certificates:', error);
    renderCertificates([]);
  }
}

function renderCertificates(certificates) {
  const container = document.getElementById('certificatesContainer');
  
  if (!container) return;
  
  if (!certificates || certificates.length === 0) {
    container.innerHTML = `
      <div class="empty-state-modern">
        <span class="material-symbols-outlined" style="font-size: 80px; color: #ccc; margin-bottom: 20px;">school</span>
        <h3>No Certificates Yet</h3>
        <p>Complete a course to earn your first certificate!</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = certificates.map(cert => `
    <div class="certificate-card">
      <div class="certificate-image">
        <img src="${cert.thumbnail_url || '/images/front-end-1.jpg'}" alt="${cert.course_title}" onerror="this.src='/images/front-end-1.jpg'">
        <div class="certificate-badge">
          <span class="material-symbols-outlined">verified</span>
        </div>
      </div>
      <div class="certificate-content">
        <div class="certificate-category">${cert.course_category || 'Course'}</div>
        <h3>${cert.course_title}</h3>
        <p class="certificate-date">Issued: ${new Date(cert.date_issued).toLocaleDateString()}</p>
        <a href="${cert.certificate_url}" target="_blank" class="btn btn-primary btn-download-cert">
          <span class="material-symbols-outlined">download</span>
          Download Certificate
        </a>
      </div>
    </div>
  `).join('');
}

