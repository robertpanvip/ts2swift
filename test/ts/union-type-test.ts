// 联合类型测试用例

// 场景 1: 基础联合类型参数
function printId(id: number | string) {
    console.log("ID:", id);
}

printId(123);
printId("ABC");

// 场景 2: 联合类型变量
let value: number | string = 42;
console.log("Value:", value);

value = "Hello";
console.log("Value:", value);

// 场景 3: 联合类型属性
interface Config {
    timeout: number | string;
    retries: number;
}

const config: Config = {
    timeout: 5000,
    retries: 3
};

console.log("Timeout:", config.timeout);

// 场景 4: 可选类型（T | undefined）
interface Person {
    name?: string;
    age?: number;
}

const person: Person = {
    name: "Alice"
};

console.log("Name:", person.name);
console.log("Age:", person.age);

// 场景 5: 可选链
const nameLength = person.name?.length;
console.log("Name length:", nameLength);
