# Secret Hitler LAN (Web-Based Companion)

A local multiplayer web-based companion for the social deduction game **Secret Hitler**. This app helps facilitate the game by:

- Distributing secret roles (Liberal, Fascist, Hitler)
- Tracking the current President and Chancellor
- Allowing anonymous ballot voting
- Enabling party membership reveals with approval
- Supporting special powers like President choosing next President

> ⚠️ This tool is meant to support the physical game and assumes players interact on a real board for policy enactment, accusations, and discussion.

---

## 🔧 Features

- 🎭 Secret role assignment with role-based visibility  
- ✅ Anonymized voting on Chancellor selection  
- 🧠 Role reveal with consent  
- 🔁 Automatic presidential rotation with override for special powers  
- 📶 LAN-playable using browser and Node.js  
- 📱 Fully responsive UI for desktop and mobile  

---

## 🚀 How to Run

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/secret-hitler-lan.git
cd secret-hitler-lan
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the server
```bash
node server/index.js
```

### 4. Open browser
Open `http://localhost:3000` (or LAN IP) in 5–10 browser tabs/devices.

> All players must be on the same network.

---

## 🧪 Game Setup

1. Each player opens the URL and enters their name.  
2. Once all players have joined (5–10), the host clicks **Start Game**.  
3. Players are secretly assigned roles:
   - 5 players: 3 Liberals, 1 Fascist, 1 Hitler
   - 7 players: 4 Liberals, 2 Fascists, 1 Hitler
   - 10 players: 6 Liberals, 3 Fascists, 1 Hitler
4. Fascists (not Hitler) will see each other and Hitler.  
5. Each round:
   - President is auto-assigned (or chosen via special power)
   - President selects a Chancellor
   - All players vote Ja/Nein anonymously
   - Chancellor is shown if approved
   - President may request to reveal a player's party (with approval)
   - President may get special powers to select next president

---

## 👥 Role Knowledge Summary

| Role     | Knows Who?                  |
|----------|-----------------------------|
| Liberal | Only themselves              |
| Fascist | Other fascists + Hitler      |
| Hitler  | Does not know fascists       |

> In 5–6 players: only 1 fascist — they know Hitler.

---

## 🛠 Development Notes

- Backend: Node.js with `express` and `socket.io`
- Frontend: Plain HTML, JS, and responsive CSS
- Responsive layout using media queries

### 🔄 Optional Dev Tool
Use Puppeteer script to auto-launch 10 browser windows for testing:
```bash
node server/oneTimeScripts/launchPlayers.js
```

---

## 📂 Folder Structure

```
secret-hitler-lan/
├── public/           # frontend (index.html, CSS, JS)
├── server/           # server logic (index.js)
├── server/oneTimeScripts/ # puppeteer test launcher
├── package.json
└── README.md
```

---

## 📜 License

MIT License. Use freely, play responsibly.

---

## 🙏 Credits

Inspired by the original Secret Hitler board game by Goat, Wolf, & Cabbage.  
Not affiliated with the creators — this tool is for educational and recreational use.

---

## 💡 Future Improvements

- Add policy tracking UI  
- Add timer per phase  
- Optional online (non-LAN) mode  
- Game state recovery on disconnect  

---

Happy deducing! 🎩