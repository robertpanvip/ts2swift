// 测试接口和类型别名

// 定义接口
interface IPerson {
    name: string;
    age: number;
    greet(): string;
}

// 实现接口的类
class Person implements IPerson {
    public name: string;
    public age: number;
    
    constructor(name: string, age: number) {
        this.name = name;
        this.age = age;
    }
    
    public greet(): string {
        return "Hello, my name is " + this.name + " and I am " + this.age + " years old.";
    }
}

// 使用类
const person = new Person("Alice", 30);
console.log(person.greet());
console.log("Name:", person.name);
console.log("Age:", person.age);

// 类型别名
type Greeting = string;
type Age = number;

const greeting: Greeting = "Hello";
const age: Age = 25;
console.log("Greeting:", greeting);
console.log("Age:", age);

// 使用类名作为函数参数
function introduce(p: Person): string {
    return p.greet();
}

console.log("Introduction:", introduce(person));

// 使用类名作为函数返回类型
function createPerson(name: string, age: number): Person {
    return new Person(name, age);
}

const person2 = createPerson("Bob", 35);
console.log("Person2:", person2.greet());
