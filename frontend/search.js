const fs = require('fs');
const lines = fs.readFileSync('../RailSync/backend/main.py', 'utf8').split('\n');
const idx = lines.findIndex(l => l.includes('network-references'));
if (idx !== -1) {
    console.log(lines.slice(Math.max(0, idx - 10), idx + 30).join('\n'));
} else {
    console.log("NOT FOUND IN MAIN.PY!");
}
