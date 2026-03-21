export class A{
    fieldA:number=123;
    constructor(a:number){
    console.log(a)
    }
    method(arg:number){
        console.log(this.fieldA);
    }
}
const a: A = new A(456);
a.method(2222)
