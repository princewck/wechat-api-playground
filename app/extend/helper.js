// app/extend/helper.js
module.exports = {
  randomStr(length = 5) {
    // this 是 helper 对象，在其中可以调用其他 helper 方法
    // this.ctx => context 对象
    // this.app => application 对象
    var arr = [
      '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0',
      'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i',
      'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r',
      's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '!',
      '@', '#', '$', '%', '^', '&', '*'
    ];
    return arr.slice()
      .sort((a, b) => Math.random() - Math.random())
      .slice(0, length)
      .join('');
  },
};