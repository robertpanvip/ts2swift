// 类型收窄测试用例

// 场景 1: 可选属性的类型收窄
interface Person {
    name?: string;
    age?: number;
}

const person: Person = {
    name: "Alice"
};

// 访问可选属性，类型是 String?
const name: String? = person.name;
console.log("Name:", name);

// 场景 2: 可选链的类型收窄
const nameLength = person.name?.length;
console.log("Optional name length:", nameLength);

// 场景 3: 显式类型注解的联合类型
let value: number | string = 42;
console.log("Value:", value);

value = "Hello";
console.log("Value:", value);

// 场景 4: 联合类型参数
function printId(id: number | string) {
    console.log("ID:", id);
}

printId(123);
printId("ABC");
