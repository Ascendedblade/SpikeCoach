// Product Page JavaScript

document.addEventListener('DOMContentLoaded', () => {
  // Back to Landing button
  const backBtn = document.getElementById('backToLanding');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }

  // Taskbar Navigation
  const taskbarItems = document.querySelectorAll('.taskbar-item');
  
  taskbarItems.forEach(item => {
    item.addEventListener('click', () => {
      // Remove active class from all items
      taskbarItems.forEach(i => i.classList.remove('active'));
      // Add active class to clicked item
      item.classList.add('active');
      
      // Get the section name from data attribute
      const section = item.dataset.section;
      console.log(`Navigated to: ${section}`);
      
      // You can add section switching logic here
      // For example, show/hide different content sections based on the selection
    });
  });
});

