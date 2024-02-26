
//THIS FILE IS ENTIRELY UNUSED!!!!
//this was before I realized i should probably be using WebSockets


const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

const threadItem = {
    url: './frontend/test.jpg',
    text: '',
    author: 'user1',
}

const threadItem2 = {
    url: '',
    text: 'This is a test',
    author: 'user2',
}

const exampleThread = {
    users: ['user1', 'user2'],
    items: [exampleImage, ]
}


const round = {
    roundNumber: 1,
    threadItems: [threadItem, threadItem2],
}

var game = {
    rounds: []
}

function initializeNewGame(numRounds)
{
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

//POST request: take data, return placeholder image test.jpg
app.post('/submitPrompt', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', './frontend/test.jpg'));
});

//get request: get thread + url query data
app.get('/getThread', (req, res) => {
    const qValue = req.query.q;
    console.log(qValue); // This will log the value of q to the console
    res.send(exampleThread);
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
