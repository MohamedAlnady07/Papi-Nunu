# How to Personalize & Share *The Star Map of Us*

Everything is ready inside `star-map-of-us/`. You don't need any coding tools or servers to preview or share it.

---

## 1. Preview It Right Now
Double-click `index.html` to open it in any browser (Chrome, Safari, Firefox, Edge).

- **Act I:** She sees the nocturnal sky and your opening dedication.
- **Act II:** She clicks **Step Into Our Sky** and touches each of the **7 stars** (each star plays a gentle chime and unfolds a heartfelt note, drawing a glowing heart constellation). Tapping empty sky reveals sweet little floating whispers.
- **Act III:** Once all 7 stars are lit, the heart illuminates completely and unlocks your **final love letter**, optional **Time Since Our Beginning** counter, and a **Release a Wish Into Our Sky** box where her wish turns into a permanent rose-gold star.

---

## 2. Two Easy Ways to Personalize It

### Option A — Visual Editor (Easiest)
1. Open `index.html?edit=1` in your browser (or press **`Shift + E`** anytime while viewing `index.html`).
2. A hidden **Customize Our Sky** drawer opens in the bottom-right corner (she won't see this when opening normal `index.html`).
3. Edit her name, your name, your special date, choose a sky atmosphere (**Midnight Gold**, **Velvet Rose**, or **Deep Aurora**), edit any of the 7 stars, or rewrite your letter.
4. Click **Preview Finale** to check your letter anytime, and **Reset Journey** before sending it so she starts with 0 lit stars.
5. Click **Download config.js** and replace the original `config.js` file in this folder with the downloaded file.

### Option B — Direct File Editing
Open `config.js` in any text editor (Notepad, VS Code, TextEdit) and update:
- `herName` and `yourName`
- `specialDate`: e.g. `"2023-05-14"` (leave `""` to hide the live time counter)
- `theme`: `"midnight-gold"`, `"velvet-rose"`, or `"deep-aurora"`
- Any text inside `opening`, `stars`, `letter`, or `skyWhispers`.

---

## 3. Adding Your Real Photos (Optional)
1. Create a folder named `photos` inside `star-map-of-us/`.
2. Drop your favorite photos inside it (e.g. `first-date.jpg`, `smiling.jpg`).
3. In `config.js` (or the Visual Editor), set that star's `photo` to `"photos/first-date.jpg"` and add an optional `photoCaption`.
4. Leave `photo: ""` on any star without a photo — it stays completely clean with no empty box.

---

## 4. Turn It Into a Private Link for Her Phone (60 Seconds, Free)
1. Visit **[app.netlify.com/drop](https://app.netlify.com/drop)** (or use GitHub Pages).
2. Drag and drop the entire `star-map-of-us` folder onto the page.
3. Copy the live link it gives you and send it to her — it works beautifully on iPhone, Android, and desktop.
