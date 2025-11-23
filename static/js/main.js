// Main JavaScript file for Fitness Activity Splitter

document.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('theme') || 'default';
    setTheme(savedTheme);
    setupThemeSelector();
    setupFormHandler();
});

function setTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('theme', themeName);
    
    const themeButtons = document.querySelectorAll('.theme-btn');
    themeButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-theme') === themeName) {
            btn.classList.add('active');
        }
    });
}

function setupThemeSelector() {
    const themeButtons = document.querySelectorAll('.theme-btn');
    themeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const themeName = this.getAttribute('data-theme');
            setTheme(themeName);
        });
    });
}

function setupFormHandler() {
    const form = document.getElementById('fitness-form');
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        handleFormSubmit();
    });
}

async function handleFormSubmit() {
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error-message');
    const resultsEl = document.getElementById('results-section');
    
    resultsEl.classList.add('hidden');
    errorEl.classList.add('hidden');
    loadingEl.classList.remove('hidden');
    
    const formData = {
        age: parseInt(document.getElementById('age').value),
        height_cm: parseFloat(document.getElementById('height_cm').value),
        weight_kg: parseFloat(document.getElementById('weight_kg').value),
        goal: document.getElementById('goal').value,
        weekly_minutes: parseInt(document.getElementById('weekly_minutes').value)
    };
    
    try {
        const response = await fetch('/api/recommend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            throw new Error('Server error: ' + response.status);
        }
        
        const data = await response.json();
        loadingEl.classList.add('hidden');
        displayResults(data);
        
    } catch (error) {
        loadingEl.classList.add('hidden');
        errorEl.textContent = 'Error: ' + error.message + '. Please try again.';
        errorEl.classList.remove('hidden');
        console.error('API Error:', error);
    }
}

function displayResults(data) {
    const resultsEl = document.getElementById('results-section');
    resultsEl.classList.remove('hidden');
    
    updateActivityType('cardio', data.split.cardio, data.activities.cardio);
    updateActivityType('strength', data.split.strength, data.activities.strength);
    updateActivityType('flexibility', data.split.flexibility, data.activities.flexibility);
    updateActivityType('rest', data.split.rest, data.activities.rest);
    
    document.getElementById('explanation-text').textContent = data.explanation;
    
    const explanationContent = document.getElementById('explanation-content');
    explanationContent.classList.add('hidden');
    document.getElementById('explain-toggle').textContent = 'Show Explanation';
    
    setupExplanationToggle();
    resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updateActivityType(type, percentage, activities) {
    const percentEl = document.getElementById(type + '-percent');
    percentEl.textContent = percentage + '%';
    
    const progressEl = document.getElementById(type + '-progress');
    setTimeout(() => {
        progressEl.style.width = percentage + '%';
    }, 50);
    
    const activitiesEl = document.getElementById(type + '-activities');
    activitiesEl.innerHTML = '';
    
    activities.forEach(activity => {
        const li = document.createElement('li');
        li.textContent = activity;
        activitiesEl.appendChild(li);
    });
}

function setupExplanationToggle() {
    const toggleBtn = document.getElementById('explain-toggle');
    const explanationContent = document.getElementById('explanation-content');
    
    const newToggle = toggleBtn.cloneNode(true);
    toggleBtn.parentNode.replaceChild(newToggle, toggleBtn);
    
    newToggle.addEventListener('click', function() {
        if (explanationContent.classList.contains('hidden')) {
            explanationContent.classList.remove('hidden');
            this.textContent = 'Hide Explanation';
        } else {
            explanationContent.classList.add('hidden');
            this.textContent = 'Show Explanation';
        }
    });
}
