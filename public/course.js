// Course page search and filter functionality
document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('exampleDataList');
  const categoryButtons = document.querySelectorAll('.category button');
  const courseCards = document.querySelectorAll('.course');

  // Search functionality
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      const searchTerm = this.value.toLowerCase();
      filterCourses(searchTerm, null);
    });
  }

  // Category filter functionality
  categoryButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Remove active class from all buttons
      categoryButtons.forEach(btn => btn.classList.remove('active'));
      // Add active class to clicked button
      this.classList.add('active');
      
      const category = this.getAttribute('data-category') || this.textContent.toLowerCase();
      const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
      filterCourses(searchTerm, category === 'all' ? null : category);
    });
  });

  function filterCourses(searchTerm, category) {
    courseCards.forEach(card => {
      const title = card.querySelector('h5')?.textContent.toLowerCase() || '';
      const description = card.querySelector('.description')?.textContent.toLowerCase() || '';
      const courseCategory = card.querySelector('.category')?.textContent.toLowerCase() || '';
      
      const matchesSearch = !searchTerm || title.includes(searchTerm) || description.includes(searchTerm);
      const matchesCategory = !category || category === 'all' || courseCategory.includes(category);
      
      if (matchesSearch && matchesCategory) {
        card.style.display = 'block';
        card.style.animation = 'fadeInUp 0.5s ease-out';
      } else {
        card.style.display = 'none';
      }
    });

    // Show no results message if needed
    const visibleCourses = Array.from(courseCards).filter(card => card.style.display !== 'none');
    let noResultsMsg = document.querySelector('.no-results-message');
    
    if (visibleCourses.length === 0) {
      if (!noResultsMsg) {
        noResultsMsg = document.createElement('div');
        noResultsMsg.className = 'no-results-message';
        noResultsMsg.innerHTML = '<p>No courses found matching your criteria.</p>';
        document.getElementById('coursesContainer').appendChild(noResultsMsg);
      }
    } else {
      if (noResultsMsg) {
        noResultsMsg.remove();
      }
    }
  }

  // Add stagger animation to course cards
  courseCards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.1}s`;
  });
});
