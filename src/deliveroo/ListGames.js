const Game = require('./Game')


class ListaGames{
    
    lista = []
    
    constructor(){
        var game0 = new Game;
        var game1 = new Game;
        this.lista.push(game0);
        this.lista.push(game1);
        console.log("Lista Games: ", this.lista);
    }
    
    join(game_n, socket, me ){
        this.lista[game_n].join(socket, me)
    }


}

module.exports = ListaGames
