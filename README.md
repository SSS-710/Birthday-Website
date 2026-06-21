# 🌙 The Unknown Man — Birthday Website

A **premium, multi-page romantic birthday website** built with pure HTML5, CSS3, and Vanilla JS.

---

## ✨ Pages

| Page | File | Description |
|------|------|-------------|
| 🌙 Login | `index.html` | Dark night sky with starfield & password |
| 🎂 Birthday | `birthday.html` | Pink luxury hero with CSS cake |
| 📸 Memories | `memories.html` | Polaroid photo gallery |
| 💌 Letter | `letter.html` | Envelope + typewriter love letter |
| 💬 Chat | `chat.html` | Firebase real-time romantic chat |

---

## 🔑 Password

```
cutie2026
```

---

## 🚀 How to Open

Simply open **`index.html`** in any modern browser (Chrome, Edge, Firefox, Safari).

> **No build step needed.** No Node.js. No server required.

---

## 💬 Firebase Chat Setup (Optional)

The chat works in **local mode** by default (messages saved on the device only).

To enable **real-time sync between two devices**:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **Add project** → Name it anything (e.g. `the-unknown-man`)
3. Click **Build → Realtime Database** → Create Database → Start in **test mode**
4. Click the ⚙️ gear icon → **Project Settings** → **Your Apps** → Add a **Web App**
5. Copy the `firebaseConfig` object
6. Open `js/chat.js` and replace the `FIREBASE_CONFIG` block at the top:

```js
const FIREBASE_CONFIG = {
  apiKey:            "your-actual-api-key",
  authDomain:        "your-project.firebaseapp.com",
  databaseURL:       "https://your-project-default-rtdb.firebaseio.com",
  projectId:         "your-project",
  storageBucket:     "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abcdef"
};
```

7. Save and refresh the page — messages will now sync across devices! 🎉

---

## 📸 Adding Your Real Photos

Open `js/memories.js` and edit the `PHOTOS` array:

```js
{ emoji: '🌸', caption: 'The day we first met', date: 'Jan 2025', color: '...' },
```

To use **real images**, replace the `polaroid-img-placeholder` div in `memories.js` with:
```html
<img class="polaroid-img" src="assets/photo1.jpg" alt="Caption" />
```

Place your images in the `assets/` folder.

---

## 📁 Folder Structure

```
the unkown man/
├── index.html          ← Login page
├── birthday.html       ← Birthday hero
├── memories.html       ← Photo gallery
├── letter.html         ← Love letter
├── chat.html           ← Firebase chat
├── css/
│   ├── variables.css   ← Design tokens
│   ├── global.css      ← Shared utilities
│   ├── login.css
│   ├── birthday.css
│   ├── memories.css
│   ├── letter.css
│   └── chat.css
├── js/
│   ├── login.js
│   ├── birthday.js
│   ├── memories.js
│   ├── letter.js
│   └── chat.js
└── assets/             ← Put your photos here
```

---

## 🎨 Customisation

- **Letter text** → Edit `LETTER_TEXT` in `js/letter.js`
- **Birthday date badge** → Edit `birthday.html` hero badge text
- **Colours** → All tokens in `css/variables.css`
- **Fonts** → Google Fonts imports at top of each HTML file

---

*Built with ❤️ — A handcrafted birthday surprise.*
