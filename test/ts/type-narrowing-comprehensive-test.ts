// 类型收窄专项测试用例
// 测试 TypeScript 类型收窄在 Swift 中的转换

// ============================================
// 场景 1: 函数参数的类型收窄
// ============================================

// TypeScript 在函数内部会收窄联合类型参数
function processId(id: number | string) {
    // 在函数内部，id 的类型仍然是 number | string
    // 但 TypeScript 允许直接使用
    console.log("Processing ID:", id);
}

processId(123);
processId("ABC");

// ============================================
// 场景 2: 可选属性的类型收窄
// ============================================

interface Person {
    name?: string;
    age?: number;
    email?: string;
}

const person: Person = {
    name: "Alice",
    age: 25
};

// 直接访问可选属性 - 类型保持为可选
const name1: string | undefined = person.name;
console.log("Name 1:", name1 ?? "nil");

const age1: number | undefined = person.age;
console.log("Age 1:", age1 ?? 0);

// ============================================
// 场景 3: 条件判断中的类型收窄
// ============================================

function printPersonInfo(person: Person) {
    // 检查可选属性是否有值
    if (person.name != nil) {
        // 使用可选链访问
        const nameLength = person.name?.length ?? 0;
        console.log("Name length:", nameLength);
    }
    
    // 使用空值合并提供默认值
    const displayName = person.name ?? "Anonymous";
    console.log("Display name:", displayName);
}

printPersonInfo(person);

// ============================================
// 场景 4: 可选链的类型收窄
// ============================================

// 可选链访问 - 返回可选类型
const nameLength: number | undefined = person.name?.length;
console.log("Name length:", nameLength ?? 0);

const emailLength: number | undefined = person.email?.length;
console.log("Email length:", emailLength ?? 0);

// 嵌套可选链
interface Address {
    city?: string;
    country?: string;
}

interface PersonWithAddress {
    name?: string;
    address?: Address;
}

const person2: PersonWithAddress = {
    name: "Bob",
    address: {
        city: "Beijing"
    }
};

// 嵌套可选链
const city: string | undefined = person2.address?.city;
console.log("City:", city ?? "nil");

const country: string | undefined = person2.address?.country;
console.log("Country:", country ?? "nil");

// ============================================
// 场景 5: 空值合并运算符的类型收窄
// ============================================

// 使用 ?? 提供默认值
const displayName: String = person.name ?? "Anonymous";
console.log("Display name:", displayName);

const displayAge: Number = person.age ?? 0;
console.log("Display age:", displayAge);

// 可选链 + 空值合并
const cityOrUnknown: String = person2.address?.city ?? "Unknown";
console.log("City or unknown:", cityOrUnknown);

// ============================================
// 场景 6: 显式类型注解的收窄
// ============================================

// 显式声明为可选类型
const explicitName: string | undefined = person.name;
console.log("Explicit name:", explicitName ?? "nil");

// 使用空值合并获取长度
const explicitNameLength = explicitName?.length ?? 0;
console.log("Explicit name length:", explicitNameLength);

// 可选链安全访问示例
// ============================================
// 场景 7: 联合类型变量的收窄
// ============================================

let value: number | string = 42;
console.log("Value:", value);

// 改变值的类型
value = "hello";
console.log("Value:", value);

// ============================================
// 场景 8: 方法返回值的类型收窄
// ============================================

class DataStore {
    getValue(key: string): number | string {
        if (key == "num") {
            return 100;
        }
        return "default";
    }
    
    getOptionalValue(key: string): number | undefined {
        if (key == "exists") {
            return 42;
        }
        return undefined;
    }
}

const store = new DataStore();

// 联合类型返回值
const val1: Any = store.getValue("num");
console.log("Value 1:", val1);

const val2: Any = store.getValue("other");
console.log("Value 2:", val2);

// 可选类型返回值
const optVal: number | undefined = store.getOptionalValue("exists");
console.log("Optional value:", optVal ?? 0);

const optVal2: number | undefined = store.getOptionalValue("not-exists");
console.log("Optional value 2:", optVal2 ?? 0);

// ============================================
// 场景 9: 复杂场景综合测试
// ============================================

interface Metadata {
    value?: number | string;
}

interface ComplexData {
    id: number | string;
    name?: string;
    metadata?: Metadata;
}

const complex: ComplexData = {
    id: 1,
    name: "Test",
    metadata: {}
};

// 多层嵌套的可选链
const metadataValue: Any = complex.metadata?.value ?? "no value";
console.log("Metadata value:", metadataValue);

// 联合类型 ID
const id: Any = complex.id;
console.log("ID:", id);

// 可选属性
const name: string | undefined = complex.name;
console.log("Name:", name ?? "nil");
