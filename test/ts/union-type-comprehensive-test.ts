// 联合类型综合测试用例

// ============================================
// 场景 1: 基础联合类型
// ============================================

// 1.1 联合类型参数
function processValue(value: number | string) {
    console.log("Processing value:", value);
}

processValue(123);
processValue("hello");

// 1.2 联合类型返回值
function getValue(useNumber: boolean): number | string {
    if (useNumber) {
        return 42;
    }
    return "Answer";
}

const result1: number | string = getValue(true);
const result2: number | string = getValue(false);
console.log("Result 1:", result1);
console.log("Result 2:", result2);

// 1.3 联合类型变量
let mixed: number | string = 100;
console.log("Mixed:", mixed);

mixed = "changed";
console.log("Mixed:", mixed);

// ============================================
// 场景 2: Interface 中的联合类型
// ============================================

interface Config {
    timeout: number | string;  // 联合类型属性
    retries: number;
    enabled: boolean;
}

const config: Config = {
    timeout: 5000,
    retries: 3,
    enabled: true
};

console.log("Timeout:", config.timeout);

config.timeout = "5s" as any;
console.log("Timeout:", config.timeout);

// ============================================
// 场景 3: 可选类型（T | undefined）
// ============================================

interface Person {
    name?: string;           // 等价于 name: string | undefined
    age?: number;            // 等价于 age: number | undefined
    email: string | undefined; // 显式声明
}

const person: Person = {
    name: "Alice",
    age: 25,
    email: undefined as any
};

// 访问可选属性
const personName: String? = person.name;
console.log("Person name:", personName ?? "nil");

const personAge: Number? = person.age;
console.log("Person age:", personAge ?? 0);

// ============================================
// 场景 4: 联合类型数组
// ============================================

// 注意：联合类型数组会转为 [Any]
const items: any[] = [1, "two", 3, "four"];
for (const item of items) {
    console.log("Item:", item);
}

// ============================================
// 场景 5: 多类型联合
// ============================================

// 多个类型的联合
type MultiType = number | string | boolean;

function processMulti(value: MultiType) {
    console.log("Multi value:", value);
}

processMulti(42);
processMulti("text");
processMulti(true);

// ============================================
// 场景 6: 嵌套 Interface 中的联合类型
// ============================================

interface Address {
    street: string;
    zipCode: number | string;
}

interface Employee {
    id: number | string;
    name?: string;
    address?: Address;
    department: string | number;
}

const employee: Employee = {
    id: 1001,
    name: "John",
    address: {
        street: "123 Main St",
        zipCode: 12345
    },
    department: "Engineering"
};

// 访问联合类型属性
console.log("Employee ID:", employee.id);
console.log("Department:", employee.department);

// 可选属性
console.log("Name:", employee.name ?? "nil");

// 嵌套可选链
const zipCode: number | string = employee.address?.zipCode ?? "N/A";
console.log("Zip code:", zipCode);

// ============================================
// 场景 7: 函数参数和返回值的联合类型
// ============================================

function combineValues(a: number | string, b: number | string): number | string {
    // 直接返回字符串连接
    return `${a}${b}`;
}

const combined1 = combineValues(10, 20);
const combined2 = combineValues("Hello", "World");
console.log("Combined 1:", combined1);
console.log("Combined 2:", combined2);

// ============================================
// 场景 8: 类中的联合类型
// ============================================

class Container {
    private data: number | string;
    
    constructor(initialData: number | string) {
        this.data = initialData;
    }
    
    getData(): number | string {
        return this.data;
    }
    
    setData(newData: number | string) {
        this.data = newData;
    }
}

const container = new Container(42);
console.log("Container data:", container.getData());

container.setData("New Value");
console.log("Container data:", container.getData());
