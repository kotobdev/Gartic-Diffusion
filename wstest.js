var { WebSocket, WebSocketServer } = require('ws');

var fs = require('fs');

var express = require('express');

const wss = new WebSocketServer({ port: 8080});

var users = [];

var submissions = [];

//two value position: round and position in round

var images = [];

var thisCycleImagesGenerated = 0;

var round = 1;

var maxRounds = 2;

//express server that serves all files here over port 2060
var app = express();

app.use(express.static('./'));

app.listen(2080, () => {
    console.log("Server running on port 2080");
});


wss.on('connection', function connection(ws) {
    ws.on('error', console.error);


    //on recieve message
    ws.on('message', function incoming(data) {
        data = JSON.parse(data);
        console.log(data);
        if (data.type == "login") {
            users.push({name: data.name, ws: ws, position: users.length});
            console.log(data.name + " has logged in. Current active users: " + users.length);
        }
        else if (data.type == "promptSubmit") {
            var user = users.find(u => u.ws == ws);
            console.log(data.name + " submitted prompt " + data.message);
            OnPromptSubmitted(user.position, data.message, user.name);
            ws.send(JSON.stringify({ type: "PromptSubmitted" }));
        }
        else {
            console.log("Invalid data type");
        }       
    });

    //on close
    ws.on('close', function close() {
        //find user with ws
        var user = users.find(u => u.ws == ws);
        //remove user from list
        users = users.filter(u => u.ws !== ws);
        console.log("A User has disconnected. Current active users: " + users.length);
    });

});

async function OnPromptSubmitted(data, prompt, username) {
    submissions.push(data);
    GenerateImage(data, prompt, username);
    console.log(submissions);
    if(submissions.length == users.length) {
        console.log("All users have submitted a prompt");
        console.log(submissions);
        //SendToAllUsers("RoundOver");
        users.forEach(user => {
            user.ws.send(JSON.stringify({type: "roundOver"}));
        });
    }
}

async function GenerateImage(position, prompt, username){
    //just async wait for 5 seconds
    //const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
    //await delay(5000)
    var filename = "./images/" + position + username + Math.random().toString(36).slice(2, 7) + ".png";
    await genImage(prompt, "", filename)

    //remove string ", photography, render, detailed, masterpiece, 8k, (realistic, UE5, deviantart)," from prompt if it exists
    var newPrompt = prompt.replace(", photography, render, detailed, masterpiece, 8k, (realistic, UE5, deviantart),", "");

    images.push({ url: filename, position: position, round: round, prompt: newPrompt, username: username});
    thisCycleImagesGenerated++;
    if(thisCycleImagesGenerated == users.length) {
        StartNewRound();
    }
}

function StartNewRound() {
    if(round < maxRounds)
    {
        console.log("All images have been generated. New round start");
        console.log(images);
        users.forEach(user => {
            //get image at user position +1 for current round
            user.position++;
            if (user.position == users.length) {
                console.log("User position of " + user.position + "for" + user.name + " is out of bounds. Moving to 0.")
                user.position = 0;
            }
            var image = GetImage(round, user.position);
            user.ws.send(JSON.stringify({ type: "newRoundImage", url: image.url }));
        });
        submissions = [];
        thisCycleImagesGenerated = 0;
        round++;
    }
    else {
        EndGame()
    }
}

function EndGame() {
    console.log("Game over, man!");
    console.log(images);
    users.forEach(user => {
        user.ws.send(JSON.stringify({ type: "gameOver", message: JSON.stringify(images) }));
    });
    images = [];
    round = 1;
    submissions = [];
    thisCycleImagesGenerated = 0;
    users = [];
}

function SendToAllUsers(data) {
    users.forEach(user => {
        user.ws.send(data);
    });
}

function GetImage(round, position)
{
    return images.find(i => i.round == round && i.position == position);
}

function base64ToPNG(base64String, outputPath) {
    const base64Data = base64String.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    fs.writeFile(outputPath, buffer, (err) => {
        if (err) {
            console.error('Error saving PNG image:', err);
        } else {
            console.log('PNG image saved successfully!');
        }
    });
}

async function genImage(posPrompt, negPrompt, filename, sampleMode) {
    //sample mode isn't used (YET!!!)
    if(sampleMode == null) {
        sampleMode = "Euler a";
    }
    else if(sampleMode == "Default") {
        sampleMode = "Euler a";
    }
    else if(sampleMode == "Artsy") {
        sampleMode = "DDIM";
    }    
    const response = await fetch('http://127.0.0.1:7860/sdapi/v1/txt2img', {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "prompt": posPrompt,
            "negative_prompt": negPrompt,
            "steps": 20
        })
    });

    var resj = await response.json();
    //console.log(resj)
    base64ToPNG(resj.images[0], filename)
    return (filename)
}