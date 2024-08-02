const Controller = require('../../deliveroo/Controller');
const PluginController = require('../PluginController');
const config =  require('../../../config')

const ParcelPlugin =  require('../entities/Parcel');
const Parcel = ParcelPlugin.core; 

class ControllerGod extends Controller{

    constructor(subject, grid){

        super(subject, grid)

        //unlock the spawner tile of the god
        let tile = this.grid.getTile( this.subject.x, this.subject.y );
        tile.unlock();

    }

    //Overide the move method, the god can move everywhere 
    async move ( incr_x, incr_y ) {
        if ( this.subject.get('moving') ) return false;     
        
        this.subject.set('moving', true)                 
        await this.stepByStep( incr_x, incr_y );
        this.subject.set('moving', false)

        return { x: this.subject.x, y: this.subject.y };
    }

    //With the click the god can chang ethe type of cell  
    async click(x,y){
        
        let tile = this.grid.getTile(x,y)
        if ( !tile ) return;

        // Ottieni la mappa TILETYPEMAP dall'oggetto config
        const tileTypeMap = config.TILETYPEMAP;

        // Trova la posizione del valore associato all'attributo type di tile (ignorando maiuscole/minuscole)
        const tileType = tile.type.toLowerCase();
        const tileTypes = Object.values(tileTypeMap).map(value => value.toLowerCase());
        const currentIndex = tileTypes.indexOf(tileType);

        // Se il tipo corrente è trovato, calcola l'indice del tipo successivo
        if (currentIndex !== -1) {
            const nextIndex = (currentIndex + 1) % tileTypes.length;
            const nextType = Object.values(tileTypeMap)[nextIndex];
            let tileClass

            try {
                let tilePlugin = require(`../tiles/${nextType}`)
                tileClass = tilePlugin.core;
            } catch (error) {
                console.warn(`Class ${nextType} not founded`);
            }

            // Crea una nuova tile del tipo successivo nella mappa
            const newTile = new tileClass(x, y, this.grid);

            // Emetti l'evento per il nuovo tile
            this.grid.emitOnePerTick('tile', newTile);
        }
        

        this.grid.emitOnePerTick( 'tile', tile )
    } 

    //spawn a parcel in the selected tile or if already exist one delete it
    async shiftClick(x,y){
        
        let tile = this.grid.getTile(x,y)
        let entity = Array.from(this.grid.getEntities()).find(e =>e.x == tile.x && e.y == tile.y)

        if(tile.type == 'spawner' && !entity){        // spawn a new parcel only if the cell i a spawner cell and it not contain already an entity

            let parcel = new Parcel(tile, this.grid)
            return 
            
        } 

        if(entity && entity.constructor.name == 'Parcel'){
            entity.delete()
        }

    } 
}


const ControlleGodPlugin = new PluginController(
    'ControllerGod',
    ControllerGod,
    {
        SUBJECTS: ['God']
    }

)

module.exports = ControlleGodPlugin;