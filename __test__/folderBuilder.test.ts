import { getFoldersSync, getFolders } from '../src/lib/folderBuilder';
import { sep, join, resolve } from 'path';
import { FolderBuilderOptions, ErrorOptions } from '../src/lib/objects';
const mock = join(process.cwd(), '__test__', 'mock');
describe('Initializing sync method', () => {
	test('empty start -> ""', () => {
		const result = getFoldersSync('');
		expect(result.length).toBe(0);
	});
	test('empty undefined -> undefined', () => {
		const result = getFoldersSync(undefined);
		expect(result.length).toBe(0);
	});
	test('relative start', () => {
		const result = getFoldersSync('./__test__/mock');
		expect(result.length).toBe(9);
		expect(result[0]).toMatchObject({
			name: 'src',
			fullName: join(mock, 'src'),
			isFolder: true,
			parent: mock,
			ext: '',
			longExt: '',
		});
	});
	test('absolute path -> C:/...', () => {
		const result = getFoldersSync(`${resolve('./__test__/mock')}/`);
		expect(result.length).toBe(9);
		expect(result[0]).toMatchObject({
			name: 'src',
			fullName: join(mock, 'src'),
			isFolder: true,
			parent: mock,
			ext: '',
			longExt: '',
		});
	});
	test('negative relative path (ignore !) -> !./', () => {
		const result = getFoldersSync('!./__test__/mock');
		expect(result.length).toBe(9);
		expect(result[0]).toMatchObject({
			name: 'src',
			fullName: join(mock, 'src'),
			isFolder: true,
			parent: mock,
			ext: '',
			longExt: '',
		});
	});
	test('negative absolute path (ignore !) -> !/', () => {
		const result = getFoldersSync(`!${mock.slice(2)}`);
		expect(result.length).toBe(9);
		expect(result[0]).toMatchObject({
			name: 'src',
			fullName: join(mock, 'src'),
			isFolder: true,
			parent: mock,
			ext: '',
			longExt: '',
		});
	});
});

describe('Initializing async method', () => {
	test('empty start -> ""', async () => {
		expect.assertions(1);
		const result = await getFolders('');
		expect(result.length).toBe(0);
	});
	test('empty undefined -> undefined', async () => {
		expect.assertions(1);
		const result = await getFolders(undefined);
		expect(result.length).toBe(0);
	});
	test('relative start', async () => {
		expect.assertions(2);
		const result = await getFolders('./__test__/mock');
		expect(result.length).toBe(9);
		expect(result[0]).toMatchObject({
			name: 'src',
			fullName: join(mock, 'src'),
			isFolder: true,
			parent: mock,
			ext: '',
			longExt: '',
		});
	});
	test('absolute path -> C:/...', async () => {
		expect.assertions(2);
		const result = await getFolders(resolve('./__test__/mock'));
		expect(result.length).toBe(9);
		expect(result[0]).toMatchObject({
			name: 'src',
			fullName: join(mock, 'src'),
			isFolder: true,
			parent: mock,
			ext: '',
			longExt: '',
		});
	});
	test('negative absolute path ignore ! ->! C:/...', async () => {
		expect.assertions(2);
		const result = await getFolders(`!${resolve('./__test__/mock')}`);
		expect(result.length).toBe(9);
		expect(result[0]).toMatchObject({
			name: 'src',
			fullName: join(mock, 'src'),
			isFolder: true,
			parent: mock,
			ext: '',
			longExt: '',
		});
	});
});

describe('Testing Options', () => {
	test('testing root and ignoreList', () => {
		const options: FolderBuilderOptions = {
			root: mock,
			ignoreList: ['./src/lib'],
		};
		const result = getFoldersSync('./', options);
		expect(result.length).toBe(7);
		expect(result[0].ignoreFolder).toBeFalsy();
		expect(result[1].ignoreFolder).toBe(true);
	});
	test('no Start fix - should throw error', () => {
		const options: FolderBuilderOptions = {
			root: mock,
			noStartFix: true,
		};
		console.log = jest.fn();
		console.warn = jest.fn();
		const result = getFoldersSync('./src/lib2', options);
		expect(result.length).toBe(0);
		expect(console.warn).not.toHaveBeenCalled();
		expect(console.log).not.toHaveBeenCalled();
	});
	test('no Start fix - includeWarnings', () => {
		const options: FolderBuilderOptions = {
			root: mock,
			noStartFix: true,
			errorHandle: ErrorOptions.log,
		};
		console.log = jest.fn();
		console.warn = jest.fn();
		const result = getFoldersSync('./src/lib2', options);
		expect(result.length).toBe(0);
		expect(console.log).toHaveBeenCalled();
		expect(console.log).toHaveBeenCalledWith("SUGGEST: setting 'noStartFix' option to false.");
		expect(console.warn).toHaveBeenCalled();
	});

	test('no Start fix on async method - includeWarnings', async () => {
		const options: FolderBuilderOptions = {
			root: mock,
			noStartFix: true,
			errorHandle: ErrorOptions.log,
		};
		console.log = jest.fn();
		console.warn = jest.fn();
		const result = await getFolders('./src/lib2', options);
		expect(result.length).toBe(0);
		expect(console.log).toHaveBeenCalled();
		expect(console.log).toHaveBeenCalledWith("SUGGEST: setting 'noStartFix' option to false.");
		expect(console.warn).toHaveBeenCalled();
	});
	test('no Start fix on async method - includeWarnings', async () => {
		const options: FolderBuilderOptions = {
			root: mock,
			noIgnoreFix: true,
			ignoreList: ['./src/lib'],
		};
		const result = await getFolders('./', options);
		expect(result.length).toBe(9);
	});
});
