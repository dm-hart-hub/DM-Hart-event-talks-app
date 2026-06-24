// Global App State
let allReleaseNotes = [];
let selectedNote = null;
let currentTheme = 'dark';

// DOM Elements
const themeToggleBtn = document.getElementById('theme-toggle');
const refreshBtn = document.getElementById('refresh-btn');
const refreshIcon = document.getElementById('refresh-icon');
const feedContainer = document.getElementById('feed-container');
const searchInput = document.getElementById('search-input');
const typeFilter = document.getElementById('type-filter');
const errorMessage = document.getElementById('error-message');

// Tweet Workspace Elements
const noSelectionState = document.getElementById('no-selection-state');
const tweetWorkspaceState = document.getElementById('tweet-workspace-state');
const metaDate = document.getElementById('meta-date');
const metaBadge = document.getElementById('meta-badge');
const tweetTextarea = document.getElementById('tweet-textarea');
const includeLinkCb = document.getElementById('include-link-cb');
const includeHashtagCb = document.getElementById('include-hashtag-cb');
const tweetPreviewText = document.getElementById('tweet-preview-text');
const charCountSpan = document.getElementById('char-count');
const progressCircle = document.getElementById('progress-circle');
const tweetBtn = document.getElementById('tweet-btn');
const resetTweetBtn = document.getElementById('reset-tweet-btn');

// Initialize the Application
document.addEventListener('DOMContentLoaded', () => {
    // Theme setup
    initTheme();
    
    // Fetch data
    fetchData();

    // Event Listeners
    refreshBtn.addEventListener('click', fetchData);
    themeToggleBtn.addEventListener('click', toggleTheme);
    searchInput.addEventListener('input', applyFilters);
    typeFilter.addEventListener('change', applyFilters);
    
    // Tweet Workspace Event Listeners
    tweetTextarea.addEventListener('input', updateTweetPreview);
    includeLinkCb.addEventListener('change', regenerateDefaultTweet);
    includeHashtagCb.addEventListener('change', regenerateDefaultTweet);
    tweetBtn.addEventListener('click', shareOnTwitter);
    resetTweetBtn.addEventListener('click', clearSelection);
});

// Theme Functions
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
}

function toggleTheme() {
    const newTheme = document.body.classList.contains('light-theme') ? 'dark' : 'light';
    setTheme(newTheme);
}

function setTheme(theme) {
    currentTheme = theme;
    localStorage.setItem('theme', theme);
    if (theme === 'light') {
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
        themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
    } else {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
        themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }
}

// Fetch Release Notes
async function fetchData() {
    // Show spinner & skeletons
    refreshIcon.classList.add('spinning');
    refreshBtn.disabled = true;
    errorMessage.classList.add('hidden');
    renderSkeletons();

    try {
        const response = await fetch('/api/release-notes');
        const result = await response.json();
        
        if (result.success) {
            allReleaseNotes = result.data;
            renderFeed(allReleaseNotes);
        } else {
            showError(result.error || 'Failed to fetch release notes.');
        }
    } catch (err) {
        showError('Network error. Make sure the server is running.');
    } finally {
        refreshIcon.classList.remove('spinning');
        refreshBtn.disabled = false;
    }
}

function renderSkeletons() {
    feedContainer.innerHTML = `
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
    `;
}

function showError(msg) {
    errorMessage.querySelector('.message-text').textContent = msg;
    errorMessage.classList.remove('hidden');
    feedContainer.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon text-danger"><i class="fa-solid fa-triangle-exclamation"></i></div>
            <h3>Error Loading Feed</h3>
            <p>${msg}</p>
        </div>
    `;
}

// Strip HTML for plain text conversion
function stripHtml(html) {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}

// Render Release Notes to Feed
function renderFeed(entries) {
    if (!entries || entries.length === 0) {
        feedContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon"><i class="fa-solid fa-inbox"></i></div>
                <h3>No Release Notes Found</h3>
                <p>Try refreshing or adjusting your search filters.</p>
            </div>
        `;
        return;
    }

    feedContainer.innerHTML = '';

    entries.forEach((dayEntry) => {
        // Create Date Group Container
        const dayCard = document.createElement('div');
        dayCard.className = 'release-day-card';

        // Day Header
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.innerHTML = `
            <div class="day-title">${dayEntry.date}</div>
            <a href="${dayEntry.link}" target="_blank" class="day-link" rel="noopener noreferrer">
                <span>View Google Source</span> <i class="fa-solid fa-up-right-from-square"></i>
            </a>
        `;
        dayCard.appendChild(dayHeader);

        // Sub-updates List
        dayEntry.sub_updates.forEach((update, idx) => {
            const updateItem = document.createElement('div');
            updateItem.className = 'update-item';
            
            // Unique ID referencing date and index
            const updateId = `${dayEntry.date}-${idx}`;
            updateItem.dataset.id = updateId;

            // Type Class badge mapping
            const typeLower = update.type.toLowerCase();
            let badgeClass = 'badge-update';
            if (typeLower.includes('feature')) badgeClass = 'badge-feature';
            else if (typeLower.includes('deprecation')) badgeClass = 'badge-deprecation';
            else if (typeLower.includes('resolved') || typeLower.includes('fix')) badgeClass = 'badge-resolved';
            else if (typeLower.includes('change')) badgeClass = 'badge-changed';

            // HTML Body
            updateItem.innerHTML = `
                <div class="update-header">
                    <span class="badge ${badgeClass}">${update.type}</span>
                    <div class="select-check"><i class="fa-solid fa-check"></i></div>
                </div>
                <div class="update-body">${update.content}</div>
            `;

            // Active / selected highlights
            if (selectedNote && selectedNote.id === updateId) {
                updateItem.classList.add('selected');
            }

            // Click listener
            updateItem.addEventListener('click', () => {
                selectUpdate(dayEntry, update, updateId);
            });

            dayCard.appendChild(updateItem);
        });

        feedContainer.appendChild(dayCard);
    });
}

// Filter release feed client-side
function applyFilters() {
    const searchVal = searchInput.value.toLowerCase().trim();
    const typeVal = typeFilter.value.toLowerCase();

    const filtered = allReleaseNotes.map(dayEntry => {
        // Filter sub-updates
        const filteredSubs = dayEntry.sub_updates.filter(update => {
            const matchesType = typeVal === 'all' || update.type.toLowerCase().includes(typeVal);
            const plainText = stripHtml(update.content).toLowerCase();
            const matchesSearch = !searchVal || 
                plainText.includes(searchVal) || 
                update.type.toLowerCase().includes(searchVal) || 
                dayEntry.date.toLowerCase().includes(searchVal);
            
            return matchesType && matchesSearch;
        });

        return {
            ...dayEntry,
            sub_updates: filteredSubs
        };
    }).filter(dayEntry => dayEntry.sub_updates.length > 0);

    renderFeed(filtered);
}

// Select update card
function selectUpdate(dayEntry, update, updateId) {
    // Remove previous selection highlight
    document.querySelectorAll('.update-item').forEach(el => el.classList.remove('selected'));
    
    // Highlight clicked card
    const selectedEl = document.querySelector(`.update-item[data-id="${updateId}"]`);
    if (selectedEl) selectedEl.classList.add('selected');

    // Update global state
    selectedNote = {
        id: updateId,
        date: dayEntry.date,
        type: update.type,
        link: dayEntry.link,
        rawContent: update.content
    };

    // Transition Workspace UI
    noSelectionState.classList.add('hidden');
    tweetWorkspaceState.classList.remove('hidden');

    // Update Meta Details
    metaDate.textContent = dayEntry.date;
    metaBadge.textContent = update.type;
    
    // Class badges mapping in meta
    metaBadge.className = 'badge';
    const typeLower = update.type.toLowerCase();
    if (typeLower.includes('feature')) metaBadge.classList.add('badge-feature');
    else if (typeLower.includes('deprecation')) metaBadge.classList.add('badge-deprecation');
    else if (typeLower.includes('resolved') || typeLower.includes('fix')) metaBadge.classList.add('badge-resolved');
    else if (typeLower.includes('change')) metaBadge.classList.add('badge-changed');
    else metaBadge.classList.add('badge-update');

    // Generate Default text
    regenerateDefaultTweet();
}

// Clear workspace state
function clearSelection() {
    selectedNote = null;
    document.querySelectorAll('.update-item').forEach(el => el.classList.remove('selected'));
    
    noSelectionState.classList.remove('hidden');
    tweetWorkspaceState.classList.add('hidden');
}

// Auto-generate default tweet text based on option checkbox states
function regenerateDefaultTweet() {
    if (!selectedNote) return;

    const plainBody = stripHtml(selectedNote.rawContent);
    // Truncate plain text to standard fit
    let contentSnippet = plainBody.substring(0, 180).trim();
    if (plainBody.length > 180) {
        contentSnippet += '...';
    }

    let defaultTweet = `Google Cloud #BigQuery [${selectedNote.type}] (${selectedNote.date}):\n\n"${contentSnippet}"`;
    
    if (includeLinkCb.checked && selectedNote.link) {
        defaultTweet += `\n\nRead more: ${selectedNote.link}`;
    }
    
    if (includeHashtagCb.checked) {
        defaultTweet += `\n#GoogleCloud #DataEngineering`;
    }

    tweetTextarea.value = defaultTweet;
    updateTweetPreview();
}

// Update character metrics & render live Twitter UI component
function updateTweetPreview() {
    const text = tweetTextarea.value;
    tweetPreviewText.textContent = text || 'Start typing your tweet...';

    // Character Counter details
    const textLength = text.length;
    const remaining = 280 - textLength;
    charCountSpan.textContent = remaining;

    // Progress circle visual updates
    const circleContainer = document.querySelector('.character-counter-wrapper');
    circleContainer.className = 'character-counter-wrapper';
    
    if (remaining < 0) {
        circleContainer.classList.add('exceeded-char');
    } else if (remaining <= 20) {
        circleContainer.classList.add('warning-char');
    }

    // Set SVG progress ring stroke metrics
    const circle = progressCircle;
    const radius = circle.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;

    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    
    let percent = Math.min(100, (textLength / 280) * 100);
    const offset = circumference - (percent / 100) * circumference;
    circle.style.strokeDashoffset = offset;

    // Disable Tweet button if empty or limit exceeded
    tweetBtn.disabled = textLength === 0 || remaining < 0;
}

// Trigger browser Web Intent share
function shareOnTwitter() {
    if (!tweetTextarea.value.trim()) return;

    const tweetText = tweetTextarea.value;
    const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    
    // Open in a popup window
    const width = 550, height = 420;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    window.open(
        twitterIntentUrl, 
        'Share on X', 
        `width=${width},height=${height},left=${left},top=${top},status=0,menubar=0,toolbar=0,location=0`
    );
}
