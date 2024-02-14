// Funzione per generare la rappresentazione grafica delle mappe
function generateMapRepresentation(map) {
    var rows = map.length;

    var representation = '<div class="map" style="--rows: ' + rows + ';">';
    for (var i = 0; i < rows; i++) {
        representation += '<div class="row">';
        for (var j = 0; j < map[i].length; j++) {
            var cellClass = '';
            switch (map[i][j]) {
                case 0:
                    cellClass = 'light-green';
                    break;
                case 1:
                    cellClass = 'dark-green';
                    break;
                case 2:
                    cellClass = 'red';
                    break;
                case 3:
                    cellClass = 'black';
                    break;
                default:
                    cellClass = '';
                    break;
            }
            representation += '<div class="cell ' + cellClass + '"></div>';
        }
        representation += '</div>';
    }
    representation += '</div>';
    return representation;
}
