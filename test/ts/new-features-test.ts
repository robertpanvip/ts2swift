// 测试新修复的特性

// 1. 方法默认参数
class Greeter {
    greet(name: string = "World"): void {
        console.log(`Hello, ${name}!`);
    }
}

const greeter = new Greeter();
greeter.greet(); // Hello, World!
greeter.greet("Alice"); // Hello, Alice!

// 2. bigint 字面量
const bigNum: bigint = 123n;
console.log('bigint:', bigNum);

// 3. 模板字符串插值
const template = `Value: ${123}`;
console.log('template:', template);

// 4. 只读数组
const readonlyArr: readonly number[] = [1, 2, 3];
console.log('readonlyArr:', readonlyArr);

// 5. 泛型类
class Container<T> {
    private value: T;
    constructor(value: T) {
        this.value = value;
    }
    getValue(): T {
        return this.value;
    }
}

const numContainer = new Container<number>(42);
console.log('numContainer:', numContainer.getValue());

// 6. 类继承
class Animal {
    move(distance: number = 0): void {
        console.log(`moved ${distance}m`);
    }
}

class Dog extends Animal {
    bark(): void {
        console.log("Woof!");
    }
}

const dog = new Dog();
dog.move(5);
dog.bark();
