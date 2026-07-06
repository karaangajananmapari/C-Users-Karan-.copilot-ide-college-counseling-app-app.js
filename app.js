let colleges = [];
let recommendations = [];
let shortlist = JSON.parse(localStorage.getItem('shortlist') || '[]');
let compareList = JSON.parse(localStorage.getItem('compare') || '[]');

const quizForm = document.getElementById('quizForm');
const collegeList = document.getElementById('collegeList');
const shortlistList = document.getElementById('shortlistList');
const compareListEl = document.getElementById('compareList');
const resultSummary = document.getElementById('resultSummary');
const filterStream = document.getElementById('filterStream');
const filterLocation = document.getElementById('filterLocation');
const filterFee = document.getElementById('filterFee');
const scrollToQuiz = document.getElementById('scrollToQuiz');

async function loadColleges() {
  const response = await fetch('colleges.json');
  colleges = await response.json();
}

function getBudgetValue(budget) {
  const map = { Low: 1, Medium: 2, High: 3 };
  return map[budget] || 2;
}

function getScoreValue(score) {
  const map = { '85': 3, '75': 2, '65': 1 };
  return map[score] || 1;
}

function calculateRecommendations(formData) {
  const scoreValue = getScoreValue(formData.score);
  const budgetValue = getBudgetValue(formData.budget);

  return colleges
    .map((college) => {
      let score = 0;
      if (college.stream === formData.stream) score += 6;
      if (college.tags.includes(formData.career)) score += 4;
      if (college.budgetLevel === budgetValue) score += 4;
      if (college.minScore <= Number(formData.score)) score += 3;
      if (college.location === formData.location || formData.location === 'Anywhere') score += 2;
      if (college.tags.includes('High Demand')) score += 2;
      return { ...college, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

function applyFilters(list) {
  const stream = filterStream.value;
  const location = filterLocation.value;
  const maxFee = Number(filterFee.value) || Infinity;

  return list.filter((college) => {
    const matchesStream = stream === 'All' || college.stream === stream;
    const matchesLocation = location === 'All' || college.location === location;
    const matchesFee = college.fees <= maxFee;
    return matchesStream && matchesLocation && matchesFee;
  });
}

function renderCollegeList() {
  const visible = applyFilters(recommendations);
  if (!visible.length) {
    collegeList.innerHTML = '<p>No colleges match your current filters yet.</p>';
    return;
  }

  resultSummary.innerHTML = `<strong>${visible.length}</strong> colleges match your profile.`;

  collegeList.innerHTML = visible
    .map(
      (college) => `
        <article class="college-card">
          <h3>${college.name}</h3>
          <p>${college.description}</p>
          <div>
            <span class="tag">${college.stream}</span>
            <span class="tag">${college.location}</span>
            <span class="tag">₹${college.fees.toLocaleString()}</span>
          </div>
          <p><strong>Eligibility:</strong> ${college.minScore}%+</p>
          <div class="actions">
            <button class="btn btn-primary" data-action="shortlist" data-id="${college.id}">Shortlist</button>
            <button class="btn btn-secondary" data-action="compare" data-id="${college.id}">Compare</button>
          </div>
        </article>
      `
    )
    .join('');
}

function renderShortlist() {
  const items = colleges.filter((college) => shortlist.includes(college.id));
  if (!items.length) {
    shortlistList.innerHTML = '<p>Your shortlist is empty.</p>';
    return;
  }

  shortlistList.innerHTML = items
    .map(
      (college) => `
        <article class="college-card">
          <h3>${college.name}</h3>
          <p>${college.location} • ₹${college.fees.toLocaleString()}</p>
        </article>
      `
    )
    .join('');
}

function renderCompare() {
  const items = colleges.filter((college) => compareList.includes(college.id));
  if (!items.length) {
    compareListEl.innerHTML = '<p>Select colleges to compare.</p>';
    return;
  }

  compareListEl.innerHTML = items
    .map(
      (college) => `
        <article class="college-card">
          <h3>${college.name}</h3>
          <p><strong>Fees:</strong> ₹${college.fees.toLocaleString()}</p>
          <p><strong>Location:</strong> ${college.location}</p>
          <p><strong>Stream:</strong> ${college.stream}</p>
        </article>
      `
    )
    .join('');
}

function toggleShortlist(id) {
  if (shortlist.includes(id)) {
    shortlist = shortlist.filter((item) => item !== id);
  } else {
    shortlist.push(id);
  }
  localStorage.setItem('shortlist', JSON.stringify(shortlist));
  renderShortlist();
}

function toggleCompare(id) {
  if (compareList.includes(id)) {
    compareList = compareList.filter((item) => item !== id);
  } else if (compareList.length < 3) {
    compareList.push(id);
  }
  localStorage.setItem('compare', JSON.stringify(compareList));
  renderCompare();
}

quizForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = Object.fromEntries(new FormData(quizForm));
  recommendations = calculateRecommendations(formData);
  renderCollegeList();
  document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
});

[filterStream, filterLocation, filterFee].forEach((element) => {
  element.addEventListener('input', renderCollegeList);
  element.addEventListener('change', renderCollegeList);
});

collegeList.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  const id = button.dataset.id;
  if (action === 'shortlist') toggleShortlist(id);
  if (action === 'compare') toggleCompare(id);
});

scrollToQuiz.addEventListener('click', () => {
  document.getElementById('counseling').scrollIntoView({ behavior: 'smooth' });
});

(async function init() {
  await loadColleges();
  renderShortlist();
  renderCompare();
})();
