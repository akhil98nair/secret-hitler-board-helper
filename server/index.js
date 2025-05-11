const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const path = require('path')

const qrcode = require('qrcode-terminal');
const os = require('os');

const app = express()
const server = http.createServer(app)
const io = socketIo(server)

let players = []
let gameStarted = false
let votes = {}
let isVoting = false

let gameState = {
    presidentIndex: 0,
    chancellorId: null,
    chooseNextPresident: false,
    tempPresidentId: null,
    overrideOnce: false // ✅ new
}

function getPlayerById(id) {
    return players.find(p => p.id === id)
}

function assignRoles(players) {
    const total = players.length;
    const fascistCount = total < 7 ? 1 : (total < 9 ? 2 : 3);
    const liberalCount = total - fascistCount - 1;

    const roles = [
        ...Array(liberalCount).fill('Liberal'),
        ...Array(fascistCount).fill('Fascist'),
        'Hitler'
    ];

    const shuffled = [...players].map(p => ({
        ...p,
        role: roles.splice(Math.floor(Math.random() * roles.length), 1)[0]
    }));

    // Determine who is Hitler and who are Fascists
    const hitler = shuffled.find(p => p.role === 'Hitler');
    const fascists = shuffled.filter(p => p.role === 'Fascist');

    // For each fascist, send them the list of fascists and hitler
    fascists.forEach(fascist => {
        const knownFascists = fascists
            .filter(f => f.id !== fascist.id)
            .map(f => ({ id: f.id, name: f.name }));

        io.to(fascist.id).emit('fascistInfo', {
            hitler: { id: hitler.id, name: hitler.name },
            fascists: knownFascists
        });
    });

    return shuffled;
}


function startNextRound() {
    let effectivePresidentIndex = gameState.presidentIndex;

    if (gameState.chooseNextPresident && gameState.tempPresidentId) {
        const newPres = getPlayerById(gameState.tempPresidentId);
        effectivePresidentIndex = players.findIndex(p => p.id === newPres.id);
        gameState.chooseNextPresident = false;
        gameState.tempPresidentId = null;
        gameState.overrideOnce = true; // ✅ apply this turn only
    }

    const president = players[effectivePresidentIndex];
    io.emit('selectChancellor', {
        presidentId: president.id,
        presidentName: president.name
    });

    // ✅ After sending the temporary president, prepare for real rotation
    if (!gameState.overrideOnce) {
        gameState.presidentIndex = (gameState.presidentIndex + 1) % players.length;
    } else {
        gameState.overrideOnce = false; // only override once
    }
}


function startVotingPhase() {
    isVoting = true
    votes = {}
    io.emit('startVoting')
}

app.use(express.static(path.join(__dirname, '../public')))

function getLocalExternalIp() {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // skip over internal (i.e. 127.0.0.1) and non-IPv4  
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return 'localhost';
}

io.on('connection', (socket) => {
    socket.on('joinGame', (name) => {
        if (gameStarted) return socket.emit('joinError', 'Game already started')
        players.push({ id: socket.id, name })
        socket.emit('yourName', name)
        io.emit('playerList', players)
    })

    socket.on('startGame', () => {
        if (players.length < 5 || players.length > 10) return socket.emit('startError', '5–10 players required')
        players = assignRoles(players)
        gameStarted = true
        gameState.presidentIndex = Math.floor(Math.random() * players.length)
        const president = players[gameState.presidentIndex]

        // Send roles to individual players
        players.forEach(p => {
            io.to(p.id).emit('yourRole', { role: p.role });
        });

        io.emit('gameStarted')
        io.emit('selectChancellor', { presidentId: president.id, presidentName: president.name })
    })

    socket.on('requestNextRound', ({ nextPresidentId }) => {
        io.emit('startNextRound');

        if (nextPresidentId) {
            gameState.chooseNextPresident = true;
            gameState.tempPresidentId = nextPresidentId;
        } else {
            gameState.chooseNextPresident = false;
            gameState.tempPresidentId = null;
        }

        startNextRound();
    });


    socket.on('getPlayers', () => {
        socket.emit('playersListForChancellor', players)
    })

    socket.on('setChancellor', (chancellorId) => {
        const chancellor = getPlayerById(chancellorId)
        if (!chancellor) return
        gameState.chancellorId = chancellor.id
        io.emit('chancellorSelected', { chancellorId: chancellor.id, chancellorName: chancellor.name })
        startVotingPhase()
    })

    socket.on('castVote', (vote) => {
        if (!isVoting || votes[socket.id]) return
        votes[socket.id] = vote
        if (Object.keys(votes).length === players.length) {
            const ja = Object.values(votes).filter(v => v === 'ja').length
            const nein = players.length - ja
            io.emit('voteResults', { ja, nein })
            io.emit('showNextRoundBtn')
            isVoting = false
        }
    })

    socket.on('revealParty', (targetId) => {
        const requester = getPlayerById(socket.id)
        const target = getPlayerById(targetId)
        const president = players[gameState.presidentIndex]

        if (!requester || !target || requester.id !== president.id) return

        io.to(target.id).emit('requestRevealApproval', {
            fromId: requester.id,
            fromName: requester.name
        })
    })

    socket.on('revealApprovalResponse', ({ approved, fromId }) => {
        const target = getPlayerById(socket.id)
        const requester = getPlayerById(fromId)
        if (!target || !requester) return

        if (approved) {
            const party = target.role === 'Liberal' ? 'Liberal' : 'Fascist'
            io.to(fromId).emit('revealPartyResult', {
                targetName: target.name,
                party
            })
        } else {
            io.to(fromId).emit('revealPartyRejected', {
                targetName: target.name
            })
        }
    })

    socket.on('disconnect', () => {
        players = players.filter(p => p.id !== socket.id)
        io.emit('playerList', players)
    })
})

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    const ip = getLocalExternalIp();
    const url = `http://${ip}:${PORT}`;
    console.log(`\n🔗 server running at ${url}\n`);
    qrcode.generate(url, { small: true });
});

