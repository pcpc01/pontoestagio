const fetch = require('node-fetch');

async function test() {
    try {
        const res = await fetch('http://localhost:3001/api/history?employeeId=ANY_ID&month=3&year=2026');
        const data = await res.json();
        console.log(data);
    } catch (e) {
        console.error('Error:', e);
    }
}

test();
