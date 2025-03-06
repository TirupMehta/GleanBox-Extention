document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search');
  const sortSelect = document.getElementById('sort');
  const clearBtn = document.getElementById('clear-btn');
  const gleaningList = document.getElementById('gleaning-list');

  loadGleanings();

  searchInput.addEventListener('input', () => loadGleanings(searchInput.value.trim(), sortSelect.value));
  sortSelect.addEventListener('change', () => loadGleanings(searchInput.value.trim(), sortSelect.value));
  clearBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all gleanings?')) {
      chrome.storage.sync.set({ gleaned: [] }, () => {
        if (chrome.runtime.lastError) {
          console.error('Clear failed:', chrome.runtime.lastError);
        } else {
          loadGleanings();
        }
      });
    }
  });
});

function loadGleanings(filter = '', sortBy = 'date-desc') {
  const gleaningList = document.getElementById('gleaning-list');
  gleaningList.innerHTML = '';
  chrome.storage.sync.get('gleaned', ({ gleaned = [] }) => {
    if (chrome.runtime.lastError) {
      console.error('Load failed:', chrome.runtime.lastError);
      gleaningList.innerHTML = '<li>Error loading gleanings</li>';
      return;
    }
    let filteredGleanings = filter
      ? gleaned.filter(g => {
          const filterWords = filter.toLowerCase().split(' ');
          return filterWords.every(word => g.text.toLowerCase().includes(word));
        })
      : gleaned;

    filteredGleanings = sortGleanings(filteredGleanings, sortBy);

    filteredGleanings.forEach((gleaning, index) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div class="gleaning-text">${gleaning.text}</div>
        <div class="gleaning-meta">
          <a href="${gleaning.url}" target="_blank">${gleaning.title}</a> - ${new Date(gleaning.timestamp).toLocaleString()}
          <button data-index="${index}">Delete</button>
        </div>
      `;
      li.querySelector('button').addEventListener('click', () => {
        if (confirm(`Delete gleaning: "${gleaning.text.substring(0, 20)}..."?`)) {
          li.classList.add('fade-out');
          setTimeout(() => {
            chrome.storage.sync.get('gleaned', ({ gleaned }) => {
              gleaned.splice(index, 1);
              chrome.storage.sync.set({ gleaned }, () => {
                if (chrome.runtime.lastError) {
                  console.error('Delete failed:', chrome.runtime.lastError);
                } else {
                  loadGleanings(filter, sortBy);
                }
              });
            });
          }, 300);
        }
      });
      gleaningList.appendChild(li);
    });
  });
}

function sortGleanings(gleanings, sortBy) {
  switch (sortBy) {
    case 'date-desc':
      return gleanings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    case 'date-asc':
      return gleanings.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    case 'title-asc':
      return gleanings.sort((a, b) => a.title.localeCompare(b.title));
    case 'title-desc':
      return gleanings.sort((a, b) => b.title.localeCompare(a.title));
    default:
      return gleanings;
  }
}