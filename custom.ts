import { isAbsolute, delimiter, parse, resolve, join, sep } from 'path';

console.log(delimiter);
console.log(isAbsolute('D:/abc'));
console.log(parse(resolve('.')));

console.log(join('C:/', 'a/b/../c/d/../'));
console.log(resolve('.'));
console.log(resolve('!.'));
console.log(resolve('!/abc'));
console.log(resolve('asdb'));
console.log(resolve('D:\\'));
console.log(parse(resolve('D:/')));
console.log(sep);

const pat = new RegExp(`[^\\${sep}]`);
console.log(pat.test('C:\\abc\\def'));
console.log('abc'.charAt(-1));

console.log(resolve('/'));
