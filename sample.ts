class Sam1 {
    name: string
    constructor(){
        console.log('Sam1 constructor');
    }
    setName(name:string){
        this.name = name;
    }
    getName():string{
        return this.name;
    }
}

export = Sam1;