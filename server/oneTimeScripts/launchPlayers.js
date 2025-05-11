const puppeteer = require('puppeteer')
const NUM_PLAYERS = 10
const GAME_URL = 'http://localhost:3000'

// Define your grid layout
const COLUMNS = 3
const WINDOW_WIDTH = 400
const WINDOW_HEIGHT = 700
const X_OFFSET = 50
const Y_OFFSET = 50

async function launchPlayer(index) {
    const col = index % COLUMNS
    const row = Math.floor(index / COLUMNS)

    const x = X_OFFSET + col * (WINDOW_WIDTH + 10)
    const y = Y_OFFSET + row * (WINDOW_HEIGHT + 40)

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: [
            `--window-size=${WINDOW_WIDTH},${WINDOW_HEIGHT}`,
            `--window-position=${x},${y}`,
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ],
        // Uncomment the line below if you want to use your system Chrome
        // executablePath: '/path/to/your/chrome' // replace with actual path if needed
    })

    const page = await browser.newPage()
    await page.goto(GAME_URL)

    const playerNames = Array.from({ length: NUM_PLAYERS }, (_, i) => `Player ${i + 1}`)
    const playerName = playerNames[index]

    await new Promise(resolve => setTimeout(resolve, 1000))

    await page.waitForSelector('#nameInput')
    await page.type('#nameInput', playerName)
    await page.click('#joinBtn')

    console.log(`✅ ${playerName} joined the game at position (${x}, ${y})`)
}

async function launchAllPlayers() {
    for (let i = 0; i < NUM_PLAYERS; i++) {
        await launchPlayer(i)
    }
}

launchAllPlayers().catch(console.error)
