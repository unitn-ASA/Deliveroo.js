const { io } = require("socket.io-client");



var socket = io( "http://localhost:8080/?name=scripted&password=123" );

socket.on("connect", () => {
    console.log( "socket", socket.id ); // x8WIv7-mJelg7on_ALbxc
});

socket.on("you", ({id, name, x, y, score}) => {
    console.log("you", {id, name, x, y, score})
});


async function randomlyMove () {
    let previousDirection = undefined;
    while ( true ) {
        let direction = [ 'up', 'right', 'down', 'left' ][ Math.floor(Math.random()*4) ];
        await new Promise( (success) => socket.emit('move', direction, (status) =>  {
            console.log( (status ? 'move done' : 'move failed') )
            success();
        } ) );
        await Promise.resolve(); // if stucked do not block the program in infinite loop
    }
}
randomlyMove()