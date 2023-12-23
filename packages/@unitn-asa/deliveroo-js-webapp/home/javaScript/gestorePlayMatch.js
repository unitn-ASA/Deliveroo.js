const partecipaBtn = document.getElementsByClassName('partecipaBtn');

Array.from(partecipaBtn).forEach(bottone => {
    bottone.addEventListener('click', function() {
      
        //console.log('Click bottone match:', bottone.getAttribute('match'));
        var match_number = bottone.getAttribute('match');

        var url = 'play';
        url += '?match=' + encodeURIComponent(match_number); 

        window.location.href = url; 
      
    });
});