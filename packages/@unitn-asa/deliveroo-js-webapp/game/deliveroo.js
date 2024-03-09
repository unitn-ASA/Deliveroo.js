import { Game } from './Game.js';
import { Client } from './Client.js';



function goToMatch( match, token ) {
    document.getElementById('panel').style.display = 'block';               // Show the laterla pannel

    document.getElementById('chatTitle').addEventListener('click',() =>{    //Sistem to open and close the caht
        const chatElement = document.getElementById('chat');
        console.log(chatElement.classList)
        if(chatElement.classList.contains('closed')) {
            chatElement.classList.remove('closed');  
        } else {
            chatElement.classList.add('closed');
        }
    })

    
    const game = new Game( { token, match } ); 

}

// const match = '0';
// const name = 'marco';
// const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQ2ZTk3MjYzMGQyIiwibmFtZSI6Im1hcmNvIiwidGVhbSI6IklUQSIsImlhdCI6MTcwODYzMjYwMX0.Kc1mrwT4vxRDEqWkMOCB1YB52UW1tYpZ2In-5loDw84';
// const team = 'team1';

// const game = new Game( { match, name, token, team } ); 

// new Client( this, {match, name, token, team} );

// goToMatch( match, name, token, team );

export { goToMatch };
