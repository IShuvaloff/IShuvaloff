// создание прокси
class Temperature {
    value = { celsius: 0, fahrenheit: 32 };
    handler = {
        set(target, key, value) {
            if (!["celsius", "fahrenheit"].includes(key)) return false;
            target[key] = value;
            switch (key) {
                case "celsius":
                    target.fahrenheit = Temperature.calculateFahrenheit(value);
                    break;
                case "fahrenheit":
                    target.celsius = Temperature.calculateCelsius(value);
                    break;
            }

            logs.push("Новый лог"); // функция декоратора
            return true;
        },
        get(target, key) {
            return target[key];
        },
    };

    constructor(value) {
        const result = new Proxy(this.value, this.handler);
        // дефолтное значение в цельсиях
        result.celsius = value || 0;
        return result;
    }

    static calculateCelsius(fahrenheit) {
        return Math.round(((fahrenheit - 32) / 1.8) * 10) / 10;
    }
    static calculateFahrenheit(celsius) {
        return celsius * 1.8 + 32;
    }

    // конструктор
    static value(value) {
        return new Temperature(value);
    }
}

let logs = [];

const temp1 = new Temperature(23);
const temp2 = new Temperature(-4);
const temp3 = Temperature.value();
temp3.fahrenheit = 45;

console.log("temp1:", temp1);
console.log("temp2:", temp2);
console.log("temp3:", temp3);
