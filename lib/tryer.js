async function sleep(time = 1500) {
  return new Promise((res) => {
    const timer = setTimeout(() => {
      clearTimeout(timer);
      res(null);
    }, time);
  });
}

export async function tryer({ tries, exector, finished }) {
  const option = {
    tries: tries || 3,
    isStop: false,
    flag: null,
    data: null,
  };

  const stop = function (flag) {
    option.isStop = true;
    option.flag = flag;
  };

  if (typeof exector !== "function") {
    return;
  }

  for (let i = 1; i < option.tries + 1; i++) {
    if (option.isStop) {
      break;
    }
    option.data = await exector(i, {
      stop,
      sleep,
      data: option.data,
    });
  }

  if (typeof finished === "function") {
    option.data = await finished(option.flag);
  }
  return option.data;
}
