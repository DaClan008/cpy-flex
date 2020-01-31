import { cpyFlex, cpyFlexSync } from '../src/index';
import { Options, PreserveState, OverWrightEnum, ErrorOptions } from '../src/lib/objects';
import { join, resolve } from 'path';
import { existsSync } from 'fs';
const rimraf = require('rimraf');

const bin = './__test__/bin';
const binFull = resolve(process.cwd(), bin);

describe('testing Synchronous copy function', () => {
	afterEach(async () => {
		await new Promise(res => {
			rimraf('./__test__/bin', () => res());
		});
	});

	test('return 0 if no to value is received', () => {
		// expect.assertions(2);
		const from = './__test__/mock/src/testsrc.txt';
		const answers = cpyFlexSync(from, '');
		expect(answers).toBe(0);
	});
	test('should copy without providing options', () => {
		const from = './__test__/mock/src/testsrc.txt';
		const answer = cpyFlexSync(from, bin);
		expect(answer).toBe(1);
	});
	test('should copy by renaming -> Name and Ext', () => {
		const from = './__test__/mock/src/testsrc.txt';
		let options: Options = {
			rename: {
				name: 'changed.ext',
				ext: 'me',
			},
		};
		let answer = cpyFlexSync(from, bin, options);
		expect(answer).toBe(1);

		let newFile = join(binFull, '__test__', 'mock', 'src', 'changed.ext.me');
		expect(existsSync(newFile)).toBe(true);

		options.rename.name = 'changed';
		options.rename.ext = '';
		answer = cpyFlexSync(from, bin, options);
		newFile = join(binFull, '__test__', 'mock', 'src', 'changed.txt');

		expect(answer).toBe(1);
		expect(existsSync(newFile)).toBe(true);

		options.rename.name = 'changed.pi';
		options.rename.removeExt = true;
		delete options.rename.ext;
		answer = cpyFlexSync(from, bin, options);
		newFile = join(binFull, '__test__', 'mock', 'src', 'changed.pi');

		expect(answer).toBe(1);
		expect(existsSync(newFile)).toBe(true);
	});

	test('should handle if bin is set to a non-accessible location', () => {
		// can only run and test in windows systems
		if (process.env.OS === 'Windows_NT') {
			// expect.assertions(2);
			const from = './src/lib';
			let myBin = 'D:/';
			const options: Options = {
				root: '__test__/mock',
				existingFiles: OverWrightEnum.rename,
				errorHandle: ErrorOptions.throwError,
			};
			expect.assertions(2);
			let codeAfter = false;
			let err = false;
			try {
				const answers = cpyFlexSync(from, myBin, options);
				codeAfter = true;
			} catch (error) {
				err = true;
			}
			expect(codeAfter).toBe(false);
			expect(err).toBe(true);
		} else expect(true).toBe(true);
	});

	test('should extend rename function -> pre/post', () => {
		const from = './__test__/mock/src/testsrc.txt';
		let options: Options = {
			rename: {
				preFix: 'pre',
				postFix: 'post',
				extPre: 'ep',
				extPost: 'pp',
			},
		};
		let answer = cpyFlexSync(from, bin, options);
		expect(answer).toBe(1);

		let newFile = join(binFull, '__test__', 'mock', 'src', 'pretestsrcpost.eptxtpp');
		expect(existsSync(newFile)).toBe(true);
	});

	test('should rename with the use of patterns', () => {
		const from = './__test__/mock/src/lib/test.lib.txt';
		let options: Options = {
			rename: {
				preFix: 'pre',
				postFix: 'post',
				extPre: 'ep',
				extPost: 'pp',
				extPat: 'est.li',
				namePat: 'ib.tx',
			},
			longExtension: true,
		};
		let answer = cpyFlexSync(from, bin, options);
		expect(answer).toBe(1);

		let newFile = join(binFull, '__test__', 'mock/src/lib', 'pretestpost.eplib.txtpp');
		expect(existsSync(newFile)).toBe(true);

		options.rename = {
			namePat: 'somefilethatdontexist',
			extPat: 'lib.txt',
			ext: '.js',
			name: 'someName',
		};
		answer = cpyFlexSync(from, bin, options);
		expect(answer).toBe(1);

		newFile = join(binFull, '__test__', 'mock/src/lib', 'test.js');
		expect(existsSync(newFile)).toBe(true);

		delete options.longExtension;
		answer = cpyFlexSync(from, bin, options);
		expect(answer).toBe(1);

		newFile = join(binFull, '__test__', 'mock/src/lib', 'test.lib.js');
		expect(existsSync(newFile)).toBe(true);
	});

	test('should get all children of copy if no stars is used', () => {
		const from = './__test__/mock/src';

		let answer = cpyFlexSync(from, bin);
		expect(answer).toBe(6);

		let newFile = join(binFull, '__test__', 'mock/src', 'testsrc.txt');
		expect(existsSync(newFile)).toBe(true);

		newFile = join(binFull, '__test__', 'mock/src', 'testsrc2.txt');
		expect(existsSync(newFile)).toBe(true);
	});

	test('should save preserve shallow', () => {
		const from = './mock/src/**';

		const options: Options = {
			preserve: PreserveState.shallow,
			root: './__test__',
		};

		let answer = cpyFlexSync(from, bin, options);
		expect(answer).toBe(6);

		let newFile = join(binFull, '', 'testsrc.txt');
		expect(existsSync(newFile)).toBe(true);

		newFile = join(binFull, '', 'testsrc2.txt');
		expect(existsSync(newFile)).toBe(true);

		newFile = join(binFull, './lib', 'testlib2.txt');
		expect(existsSync(newFile)).toBe(true);

		newFile = join(binFull, './lib2', 'testlib2.txt');
		expect(existsSync(newFile)).toBe(true);
	});

	test('should save preserve shallow with multiple folders', () => {
		const from = ['./mock/src/lib/**', './mock/src/lib2/**'];

		const options: Options = {
			preserve: PreserveState.shallow,
			root: './__test__',
		};

		let answer = cpyFlexSync(from, bin, options);
		expect(answer).toBe(4);

		let newFile = join(binFull, './lib', 'testlib2.txt');
		expect(existsSync(newFile)).toBe(true);

		newFile = join(binFull, './lib2', 'testlib2.txt');
		expect(existsSync(newFile)).toBe(true);

		const from2 = ['./mock/src/lib/**', './mock/src/*'];

		answer = cpyFlexSync(from2, bin, options);
		expect(answer).toBe(4);
	});

	test('should save with preserve deep', () => {
		const from = ['./mock/**', '!./mock/src/lib/**/*.*'];

		const options: Options = {
			preserve: PreserveState.deep,
			root: './__test__',
		};

		let answer = cpyFlexSync(from, bin, options);
		expect(answer).toBe(4);

		let newFile = join(binFull, 'src/lib', 'test.lib.txt');
		expect(existsSync(newFile)).toBe(false);

		newFile = join(binFull, 'src/lib2', 'testlib2.txt');
		expect(existsSync(newFile)).toBe(true);

		newFile = join(binFull, 'src', 'testsrc.txt');
		expect(existsSync(newFile)).toBe(true);
	});

	test('should save with preserve none', () => {
		const from = ['./mock/src/lib/**', './mock/src/lib2/**'];

		const options: Options = {
			preserve: PreserveState.none,
			root: './__test__',
		};

		let answer = cpyFlexSync(from, bin, options);
		expect(answer).toBe(4);

		let newFile = join(binFull, 'testlib22.txt');
		expect(existsSync(newFile)).toBe(true);

		newFile = join(binFull, 'test.lib.txt');
		expect(existsSync(newFile)).toBe(true);
	});

	test('set existingFiles to rename', () => {
		// expect.assertions(2);
		const from = './src/lib';
		const options: Options = {
			root: '__test__/mock',
			existingFiles: OverWrightEnum.rename,
			errorHandle: ErrorOptions.log,
		};

		for (let i = 0; i < 2; i++) {
			const answer = cpyFlexSync(from, bin, options);
			expect(answer).toBe(2);
			let file;
			if (i > 0) file = join(binFull, `src/lib/testlib2(${i}).txt`);
			else file = join(binFull, 'src/lib/testlib2.txt');
			expect(existsSync(file)).toBe(true);
		}
	});

	test('set existingFiles to rename and ignoreMax', () => {
		// expect.assertions(2);
		const from = './src/lib';
		const options: Options = {
			root: '__test__/mock',
			existingFiles: OverWrightEnum.rename,
			errorHandle: ErrorOptions.log,
			ignoreMax: true,
			maxRenameCount: 2,
		};

		for (let i = 0; i < 2; i++) {
			const answer = cpyFlexSync(from, bin, options);
			expect(answer).toBe(2);
			let file;
			if (i > 0) file = join(binFull, `src/lib/testlib2(${i}).txt`);
			else file = join(binFull, 'src/lib/testlib2.txt');
			expect(existsSync(file)).toBe(true);
		}
		console.warn = jest.fn();
		const answers2 = cpyFlexSync(from, bin, options);
		expect(answers2).toBe(2);
		expect(console.warn).not.toBeCalled();
	});

	test('set existingFiles to rename and ignoreMax set to false', () => {
		// expect.assertions(2);
		const from = './src/lib';
		const options: Options = {
			root: '__test__/mock',
			existingFiles: OverWrightEnum.rename,
			maxRenameCount: 2,
		};

		for (let i = 0; i < 3; i++) {
			const answer = cpyFlexSync(from, bin, options);
			expect(answer).toBe(2);
			let file;
			if (i > 0) file = join(binFull, `src/lib/testlib2(${i}).txt`);
			else file = join(binFull, 'src/lib/testlib2.txt');
			expect(existsSync(file)).toBe(true);
		}
		console.warn = jest.fn();
		const answers2 = cpyFlexSync(from, bin, options);
		expect(answers2).toBe(0);
		expect(console.warn).not.toBeCalled();
	});
});

describe('testing Async copy function', () => {
	afterEach(async () => {
		await new Promise(res => {
			rimraf('./__test__/bin', () => res());
		});
	});
	test('return 0 if no from value is received', async () => {
		// expect.assertions(2);
		const from = '';
		const answers = await cpyFlex(from, bin);
		expect(answers).toBe(0);
	});
	test('set bin to a non-accessible location', async () => {
		// can only run in windows systems
		if (process.env.OS === 'Windows_NT') {
			// expect.assertions(2);
			const from = './src/lib';
			let myBin = 'D:/';
			const options: Options = {
				root: '__test__/mock',
				existingFiles: OverWrightEnum.rename,
				errorHandle: ErrorOptions.throwError,
			};
			expect.assertions(2);
			try {
				const answers = await cpyFlex(from, myBin, options);
				expect(answers).toBe(0);
			} catch (error) {
				expect(error).toBeTruthy();
				expect(error).toBeTruthy();
			}
		} else expect(true).toBe(true);
	});

	test('set bin to a non-accessible location2', async () => {
		// can only run in windows systems
		if (process.env.OS === 'Windows_NT') {
			// expect.assertions(2);
			const from = './src/lib';
			let myBin = 'D:/';
			const options: Options = {
				root: '__test__/mock',
				existingFiles: OverWrightEnum.rename,
				errorHandle: ErrorOptions.log,
			};
			expect.assertions(1);
			console.warn = jest.fn();
			try {
				const answers = await cpyFlex(from, myBin, options);
				expect(console.warn).toBeCalledTimes(2);
			} catch (error) {
				expect(error).toBeTruthy();
				expect(error).toBeTruthy();
			}
		} else expect(true).toBe(true);
	});

	test('should rename longExtension', async () => {
		// expect.assertions(2);
		const from = './src/lib';
		const options: Options = {
			root: '__test__/mock',
			rename: {
				name: 'file.js',
				removeExt: true,
				namePat: 't.lib',
			},
			longExtension: true,
		};

		let answer = await cpyFlex(from, bin, options);
		expect(answer).toBe(2);

		let newFile = join(binFull, 'src/lib/file.js');
		expect(existsSync(newFile)).toBe(true);

		newFile = join(binFull, 'src/lib/testlib2.txt');
		expect(existsSync(newFile)).toBe(true);
	});

	test('should rename longExtension without ext in name', async () => {
		// expect.assertions(2);
		const from = './src/lib';
		const options: Options = {
			root: '__test__/mock',
			rename: {
				name: 'file',
				removeExt: true,
				namePat: 't.lib',
			},
			longExtension: true,
		};

		let answer = await cpyFlex(from, bin, options);
		expect(answer).toBe(2);

		let newFile = join(binFull, 'src/lib/file');
		expect(existsSync(newFile)).toBe(true);

		newFile = join(binFull, 'src/lib/testlib2.txt');
		expect(existsSync(newFile)).toBe(true);
	});

	// root is tested from start
	test("should not write if dest can't be created", async () => {
		// expect.assertions(2);
		const from = './src/lib';
		const options: Options = {
			root: '__test__/mock',
			rename: {
				name: 'file',
				removeExt: true,
				namePat: 't.lib',
			},
			longExtension: true,
		};

		let answer = await cpyFlex(from, bin, options);
		expect(answer).toBe(2);

		let newFile = join(binFull, 'src/lib/file');
		expect(existsSync(newFile)).toBe(true);

		newFile = join(binFull, 'src/lib/testlib2.txt');
		expect(existsSync(newFile)).toBe(true);
	});

	test('set existingFiles to dontCopy', async () => {
		// expect.assertions(2);
		const from = './src/lib';
		const options: Options = {
			root: '__test__/mock',
			existingFiles: OverWrightEnum.dontCopy,
			errorHandle: ErrorOptions.log,
		};

		let answer = await cpyFlex(from, bin, options);
		expect(answer).toBe(2);
		console.warn = jest.fn();
		answer = await cpyFlex(from, bin, options);
		expect(answer).toBe(0);
		expect(console.warn).toBeCalledTimes(2);
	});

	test('set existingFiles to rename and ignoreMax', async () => {
		// expect.assertions(2);
		const from = './src/lib';
		const options: Options = {
			root: '__test__/mock',
			existingFiles: OverWrightEnum.rename,
			errorHandle: ErrorOptions.log,
			ignoreMax: true,
			maxRenameCount: 2,
		};

		for (let i = 0; i < 2; i++) {
			const answer = await cpyFlex(from, bin, options);
			expect(answer).toBe(2);
			let file;
			if (i > 0) file = join(binFull, `src/lib/testlib2(${i}).txt`);
			else file = join(binFull, 'src/lib/testlib2.txt');
			expect(existsSync(file)).toBe(true);
		}
		console.warn = jest.fn();
		const answers2 = await cpyFlex(from, bin, options);
		expect(answers2).toBe(2);
		expect(console.warn).not.toBeCalled();
	});

	test('set existingFiles to rename and ignoreMax set to false', async () => {
		// expect.assertions(2);
		const from = './src/lib';
		const options: Options = {
			root: '__test__/mock',
			existingFiles: OverWrightEnum.rename,
			errorHandle: ErrorOptions.log,
			maxRenameCount: 2,
		};

		for (let i = 0; i < 3; i++) {
			const answer = await cpyFlex(from, bin, options);
			expect(answer).toBe(2);
			let file;
			if (i > 0) file = join(binFull, `src/lib/testlib2(${i}).txt`);
			else file = join(binFull, 'src/lib/testlib2.txt');
			expect(existsSync(file)).toBe(true);
		}
		console.warn = jest.fn();
		const answers2 = await cpyFlex(from, bin, options);
		expect(answers2).toBe(0);
		expect(console.warn).toBeCalledTimes(2);
	});

	test('should be able to handle negatives', async () => {
		const from = ['./mock/**', '!./mock/src/lib/**/*.*'];

		const options: Options = {
			preserve: PreserveState.deep,
			root: './__test__',
		};

		let answer = await cpyFlex(from, bin, options);
		expect(answer).toBe(4);

		let newFile = join(binFull, 'src/lib', 'test.lib.txt');
		expect(existsSync(newFile)).toBe(false);

		newFile = join(binFull, 'src/lib2', 'testlib2.txt');
		expect(existsSync(newFile)).toBe(true);

		newFile = join(binFull, 'src', 'testsrc.txt');
		expect(existsSync(newFile)).toBe(true);
	});

	test('should save preserve shallow with multiple folders', async () => {
		const from = ['./mock/src/lib/**', './mock/src/lib2/**'];

		const options: Options = {
			preserve: PreserveState.shallow,
			root: './__test__',
		};

		let answer = await cpyFlex(from, bin, options);
		expect(answer).toBe(4);

		let newFile = join(binFull, './lib', 'testlib2.txt');
		expect(existsSync(newFile)).toBe(true);

		newFile = join(binFull, './lib2', 'testlib2.txt');
		expect(existsSync(newFile)).toBe(true);

		const from2 = ['./mock/src/lib/**', './mock/src'];

		answer = await cpyFlex(from2, bin, options);
		expect(answer).toBe(6);
	});
});
