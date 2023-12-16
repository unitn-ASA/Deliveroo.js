const partecipaBtn = document.getElementsByClassName('partecipaBtn');

Array.from(partecipaBtn).forEach(bottone => {
    bottone.addEventListener('click', function() {
      
        //console.log('Click bottone game:', bottone.getAttribute('game'));
        var game_number = bottone.getAttribute('game');

        var url = 'play';
        url += '?game_number=' + encodeURIComponent(game_number); 

        window.location.href = url; 
      
    });
});