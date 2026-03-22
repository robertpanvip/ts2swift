// 联合类型简单测试用例

// 1. 联合类型参数
function processValue(value: number | string) {
    console.log("Processing value:", value);
}

processValue(123);
processValue("hello");

// 2. 联合类型返回值 - 固定返回数字
function getNumberValue(): number | string {
    return 42;
}

const result1: number | string = getNumberValue();
console.log("Result 1:", result1);

// 3. 联合类型返回值 - 固定返回字符串
function getStringValue(): number | string {
    return "Answer";
}

const result2: number | string = getStringValue();
console.log("Result 2:", result2);

// 3. 联合类型变量
let mixed: number | string = 100;
console.log("Mixed:", mixed);

mixed = "changed";
console.log("Mixed:", mixed);

// 4. Interface 中的联合类型
interface Config {
    timeout: number | string;
    retries: number;
}

const config: Config = {
    timeout: 5000,
    retries: 3
};

console.log("Timeout:", config.timeout);

// 5. 可选类型 (T | undefined)
interface Person {
    name?: string;
    age?: number;
}

const person: Person = {
    name: "Alice",
    age: 25
};

const personName: string | undefined = person.name;
console.log("Person name:", personName ?? "nil");

const personAge: number | undefined = person.age;
console.log("Person age:", personAge ?? 0);

// 6. 多类型联合
type MultiType = number | string | boolean;

function processMulti(value: MultiType) {
    console.log("Multi value:", value);
}

processMulti(42);
processMulti("text");
processMulti(true);

// 7. 嵌套 Interface
interface Address {
    street: string;
    zipCode: number | string;
}

interface Employee {
    id: number | string;
    name?: string;
    address?: Address;
}

const employee: Employee = {
    id: 1001,
    name: "John",
    address: {
        street: "123 Main St",
        zipCode: 12345
    }
};

console.log("Employee ID:", employee.id);
console.log("Employee name:", employee.name ?? "nil");

const zipCode: number | string = employee.address?.zipCode ?? "N/A";
console.log("Zip code:", zipCode);
