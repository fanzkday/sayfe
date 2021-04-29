async function sleep(time = 1500) {
  return new Promise((res) => {
    const timer = setTimeout(() => {
      clearTimeout(timer);
      res(null);
    }, time);
  });
}

const getOption = tries => ({
  tries: tries || 3,
  isStop: false,
  flag: null,
  data: null,
});

const stop = function (option, flag) {
  option.isStop = true;
  option.flag = flag;
};



async function tryerAsync({ tries, exector, finished }) {

  const option = getOption(tries);

  if (typeof exector !== "function") {
    return;
  }

  for (let i = 0; i < option.tries; i++) {
    if (option.isStop) {
      break;
    }
    option.data = await exector(i, {
      stop: stop.bind(null, option),
      sleep,
      data: option.data,
    });
  }

  if (typeof finished === "function") {
    option.data = await finished(option.flag);
  }
  return option.data;
}

function tryer({ tries, exector, finished, isAsync }) {

  if (isAsync) {
    return tryerAsync({ tries, exector, finished })
  }

  const option = getOption(tries);

  if (typeof exector !== "function") {
    return;
  }

  for (let i = 0; i < option.tries; i++) {
    if (option.isStop) {
      break;
    }
    option.data = exector(i, {
      stop: stop.bind(null, option),
      data: option.data,
    });
  }

  if (typeof finished === "function") {
    option.data = finished(option.flag);
  }
  return option.data;
}

module.exports = { tryer, default: tryer };
