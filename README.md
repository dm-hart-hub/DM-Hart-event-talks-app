# BigQuery Release Notes Hub & Twitter Sharing App

A modern web application built using **Python Flask** and vanilla **HTML, JavaScript, and CSS** that fetches Google Cloud BigQuery release notes from the official Atom RSS feed, formats them, and allows users to compose and share tweets about specific updates directly.

---

## 🚀 Features

* **Live Atom RSS Feed Parser:** Automatically fetches and parses Google's release XML feed, grouping updates by date.
* **Granular Update Extraction:** Splits daily updates into individual cards categorized by type (e.g. *Feature*, *Deprecation*, *Change*, *Resolved*).
* **Interactive Tweet Composer:** Select any update card to instantly draft a tweet.
  * Adjust features like adding hashtags and official links.
  * Live character count validation (280 characters limit) with an animated circular progress indicator.
* **X/Twitter Card Mock Preview:** Real-time visual representation of what the post will look like on social media.
* **Search & Filters:** Instantly search through updates or filter by change type.
* **Theme Switching:** Dark mode by default with light theme toggling.
* **Fault-Tolerant Cache:** Features built-in server-side caching as fallback protection in case of API rate limits or network issues.

---

## 📁 File Structure

```text
├── app.py                  # Flask Web Server & RSS Parsing engine
├── templates/
│   └── index.html          # Web dashboard layout
├── static/
│   ├── app.js              # State management, filter logic, and Twitter intents
│   └── style.css           # Custom CSS variables, glassmorphic themes, and animations
├── .gitignore              # Ignored compilation files, environments, and directories
└── README.md               # Project documentation
```

---

## 🛠️ Getting Started

### 📋 Prerequisites
Ensure you have Python 3.x installed.

### 🔌 Installation & Setup
1. Clone or download this project workspace.
2. Install dependencies:
   ```bash
   pip install flask requests beautifulsoup4
   ```

### 🚀 Running Locally
1. Start the Flask application:
   ```bash
   python app.py
   ```
2. Open your browser and navigate to:
   👉 **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## 🔄 Deployment & Version Control

To push local updates to your GitHub repository:
```bash
git add .
git commit -m "Your commit message"
git push origin main
```
The repository is tracked on GitHub at:
[dm-hart-hub/DM-Hart-event-talks-app](https://github.com/dm-hart-hub/DM-Hart-event-talks-app)
