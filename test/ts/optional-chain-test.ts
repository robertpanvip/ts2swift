// 测试可选链 ?. 运算符

interface Address {
    city?: string;
    country?: string;
}

interface Person {
    name?: string;
    age?: number;
    address?: Address;
}

const person: Person = { 
    name: "Alice",
    address: {
        city: "Beijing"
    }
};

// 可选链访问
const city = person.address?.city;
const country = person.address?.country;
const zipCode = person.address?.city?.length;

// 可选链 + 空值合并
const defaultCity = person.address?.city ?? "Unknown";
const defaultCountry = person.address?.country ?? "Unknown";

console.log("City:", city);
console.log("Country:", country);
console.log("Default City:", defaultCity);
console.log("Default Country:", defaultCountry);
