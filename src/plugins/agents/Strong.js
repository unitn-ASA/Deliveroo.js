const Agent =  require('../../deliveroo/Agent');


class Strong extends Agent{

    constructor ( grid, id, name, tile, type = 'god' ) {
        
        super(grid, id, name, tile, type); 

        let color = 0xFF0000 ;
        let style = {shape:'cone', params:{radius:0.5, height: 1, radialSegments:4}, color: color }

        this.set('name', name || this.id )                             
        this.set('label', this.id);
        this.set('style', style)
        this.set('speed', 750)

    }
}

const StrongPlugin = {
    name: 'Strong',
    extension: Strong
}

module.exports = StrongPlugin;