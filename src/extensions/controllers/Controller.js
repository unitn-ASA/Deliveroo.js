
class Controller {

    subject;

    constructor(subject){
        this.subject = subject
    }


    async up() {
        try {
            //console.log('Agent ', this.name + ' up');
            return await this.subject.move(0, 1);
        } catch (error) {
            console.error(`Error in up: ${error}`);
        }
    }
    
    async down() {
        try {
            //console.log('Agent ', this.name + ' down');
            return await this.subject.move(0, -1);
        } catch (error) {
            console.error(`Error in down: ${error}`);
        }
    }
    
    async left() {
        try {
            //console.log('Agent ', this.name + ' left');
            return await this.subject.move(-1, 0);
        } catch (error) {
            console.error(`Error in left: ${error}`);
        }
    }
    
    async right() {
        try {
            //console.log('Agent ', this.name + ' right');
            return await this.subject.move(1, 0);
        } catch (error) {
            console.error(`Error in right: ${error}`);
        }
    }
    
    async jump() {
        try {
            //console.log('Agent ', this.name + ' jump');
        } catch (error) {
            console.error(`Error in jump: ${error}`);
        }
    }
    
    async shiftUp() {
        try {
            //console.log('Agent ', this.name + ' shiftUp');
        } catch (error) {
            console.error(`Error in shiftUp: ${error}`);
        }
    }
    
    async shiftDown() {
        try {
            //console.log('Agent ', this.name + ' shiftDown');
        } catch (error) {
            console.error(`Error in shiftDown: ${error}`);
        }
    }
    
    async shiftLeft() {
        try {
            //console.log('Agent ', this.name + ' shiftLeft');
        } catch (error) {
            console.error(`Error in shiftLeft: ${error}`);
        }
    }
    
    async shiftRight() {
        try {
            //console.log('Agent ', this.name + ' shiftRight');
        } catch (error) {
            console.error(`Error in shiftRight: ${error}`);
        }
    }
    
    async shiftJump() {
        try {
            //console.log('Agent ', this.name + ' shiftJump');
        } catch (error) {
            console.error(`Error in shiftJump: ${error}`);
        }
    }
    
    async pickUp() {
        try {
            return await this.subject.pickUp();
        } catch (error) {
            console.error(`Error in pickUp: ${error}`);
        }
    }
    
    async putDown(ids = []) {
        try {
            return await this.subject.putDown(ids);
        } catch (error) {
            console.error(`Error in putDown: ${error}`);
        }
    }
    
    async shiftPickUp() {
        try {
            //console.log('Agent ', this.name + ' shiftPickUp');
        } catch (error) {
            console.error(`Error in shiftPickUp: ${error}`);
        }
    }
    
    async shiftPutDown(ids = []) {
        try {
            //console.log('Agent ', this.name + ' shiftPutDown');
        } catch (error) {
            console.error(`Error in shiftPutDown: ${error}`);
        }
    }
    
    async click(x, y) {
        try {
            //console.log('Agent ', this.name + ' click (', x + ' ', y + ' )');
        } catch (error) {
            console.error(`Error in click: ${error}`);
        }
    }
    
    async shiftClick(x, y) {
        try {
            //console.log('Agent ', this.name + ' shiftClick (', x + ' ', y + ' )');
        } catch (error) {
            console.error(`Error in shiftClick: ${error}`);
        }
    }
    
}

module.exports = Controller;


