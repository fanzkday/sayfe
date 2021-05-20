### Usage

#### 1. tryer - 尝试多次执行某个操作, 直到完成目标设定

```js
import { tryer } from "sayfe";

async function main() {
  // 如果finished函数存在, tryer的返回值即为finished函数的返回值; 否者, 为最后一次exector的返回值
  const data = await tryer({
    /**
     * 尝试执行的次数, 默认3次
     */
    tries: 3,
    /**
     * index: 当前执行次数的索引, 从1开始
     * stop: 可手动结束tryer, 触发finished
     * sleep: 休眠函数, 可灵活控制两次之间的间隔
     * data: 上一次Exector的返回值
     */
    exector: async (index, { stop, sleep, data }) => {
      await sleep(index * 1000);
      console.log("current index", index);
      console.log("previous exector return data", data);
      if (index === 3) {
        stop("deliver to finished value");
      }
      return "return data";
    },
    /**
     * 执行结束的回调
     */
    finished: (info) => {
      console.log("receiver stop info", info);
      return "hello";
    },
  });
}
```

#### 2. calc - 计算数学表达式的值

```js
import { calc } from "sayfe";

calc("0.1+0.2").format({ precision: 3, isPadZero: false }); // 0.3
calc("0.1+0.2").format({ precision: 3, isPadZero: true }); // 0.300
calc("0.1+0.2").value; // 0.3

calc("(0.1+0.2)*0.2").format({ precision: 0, isPadZero: false }); // 0
calc("(0.1+0.2)*0.2").format({ precision: 3, isPadZero: true }); // 0.060
calc("(0.1+0.2)*0.2").value; // 0.06
```

#### 3. yapi - 将 yapi 文档转换为 typescript 的 interface

- 配置

```jsonc
// package.json
{
  "yapi": {
    "host": "http://x.x.x.x:8080", // 服务器地址
    "token": "9de5079657fe9393a481d49f7d60dfde0f770789200df339508998257ab9de7a", // 项目的token
    "projectId": "80", // 项目的id
    "outDir": "src/yapis" // 输出目录
  }
}
```

- 执行

```shell
node ./node_modules/sayfe/lib/toInferface.js
```
