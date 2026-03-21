// 修饰符测试 - readonly, static, abstract

// 1. readonly 测试
class ReadonlyTest {
    readonly x: number = 10;
    readonly y: number = 20;
    normalVar: number = 30;
    
    constructor() {}
    
    print() {
        console.log('x:', this.x);
        console.log('y:', this.y);
        console.log('normalVar:', this.normalVar);
    }
}

// 2. static 测试
class StaticTest {
    static count: number = 0;
    static name: string = 'StaticTest';
    instanceValue: number = 1;
    
    static increment() {
        StaticTest.count = StaticTest.count + 1;
        console.log('count:', StaticTest.count);
    }
    
    static getName() {
        return StaticTest.name;
    }
    
    getValue() {
        return this.instanceValue;
    }
}

// 3. static + readonly 测试
class StaticReadonlyTest {
    static readonly MAX_VALUE: number = 100;
    static readonly MIN_VALUE: number = 0;
    
    static getMax() {
        return StaticReadonlyTest.MAX_VALUE;
    }
}

// 4. abstract 测试
abstract class AbstractBase {
    name: string = 'Abstract';
    abstract getValue(): number;
    
    printName() {
        console.log('name:', this.name);
    }
}

class ConcreteClass extends AbstractBase {
    override getValue(): number {
        return 42;
    }
}

// 5. abstract static 方法测试
abstract class AbstractWithStatic {
    static readonly VERSION: string = '1.0.0';
    
    abstract doSomething(): void;
    
    static getVersion() {
        return AbstractWithStatic.VERSION;
    }
}

class ConcreteWithStatic extends AbstractWithStatic {
    override doSomething() {
        console.log('Doing something');
    }
}

// 运行测试
console.log('=== Readonly Test ===');
const readonlyTest = new ReadonlyTest();
readonlyTest.print();

console.log('=== Static Test ===');
StaticTest.increment();
StaticTest.increment();
console.log('StaticTest.name:', StaticTest.getName());
const staticInstance = new StaticTest();
console.log('instance value:', staticInstance.getValue());

console.log('=== Static Readonly Test ===');
console.log('MAX_VALUE:', StaticReadonlyTest.getMax());

console.log('=== Abstract Test ===');
const concrete = new ConcreteClass();
concrete.printName();
console.log('value:', concrete.getValue());

console.log('=== Abstract With Static Test ===');
console.log('VERSION:', AbstractWithStatic.getVersion());
const concreteStatic = new ConcreteWithStatic();
concreteStatic.doSomething();
