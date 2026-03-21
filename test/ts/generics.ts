// 测试泛型

// 泛型类
class Container<T> {
    private value: T;
    
    constructor(value: T) {
        this.value = value;
    }
    
    public getValue(): T {
        return this.value;
    }
    
    public setValue(value: T): void {
        this.value = value;
    }
}

// 使用泛型类
const stringContainer = new Container<string>("Hello");
console.log("String value:", stringContainer.getValue());

const numberContainer = new Container<number>(42);
console.log("Number value:", numberContainer.getValue());

// 泛型函数
function identity<T>(arg: T): T {
    return arg;
}

const result1 = identity<string>("World");
console.log("Identity string:", result1);

const result2 = identity<number>(100);
console.log("Identity number:", result2);

// 泛型接口
interface IPair<T, U> {
    first: T;
    second: U;
}

class Pair<T, U> implements IPair<T, U> {
    first: T;
    second: U;
    
    constructor(first: T, second: U) {
        this.first = first;
        this.second = second;
    }
}

const pair = new Pair<string, number>("Age", 25);
console.log("Pair first:", pair.first);
console.log("Pair second:", pair.second);
