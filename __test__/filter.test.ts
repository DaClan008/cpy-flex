import { filterBuilder, getFilters } from '../src/lib/filter';
import { FolderObject } from '../src/lib/objects';
const { sep, resolve, parse } = require('path');

const cwd = process.cwd() + sep;
const drive = parse(cwd).root;
// sanitized variables
const cwdSanitized = cwd.replace(/(\\|\/)/g, `\\${sep}`);
const sanSep = `\\${sep}`;
const sanDrive = drive.replace(/(\\|\/)/g, `\\${sep}`);
const anyEnd = `(${sanSep}.+)?$`;

describe('Testing FileBuilder initialization', () => {
	test('must be able to build normal directory path when no values has been supplied', () => {
		let test: FolderObject = filterBuilder(undefined, undefined);

		expect(test).toEqual({
			file: '',
			anyExtension: true,
			anyFile: true,
			isComplex: false,
			exact: true,
			isNegative: false,
			base: cwd,
			startStr: cwd,
			root: drive,
			reg: new RegExp(cwdSanitized.replace(/(\\|\/)+$/, '') + anyEnd),
			searchStr: cwdSanitized.replace(/(\\|\/)+$/, '') + anyEnd,
		});
	});

	test('must be able to build normal directory path when cwd has been supplied', () => {
		let test: FolderObject = filterBuilder(undefined, { root: cwd });

		expect(test).toEqual({
			file: '',
			isNegative: false,
			anyExtension: true,
			exact: true,
			anyFile: true,
			isComplex: false,
			base: cwd,
			startStr: cwd,
			root: drive,
			reg: new RegExp(cwdSanitized.replace(/(\\|\/)+$/, '') + anyEnd),
			searchStr: cwdSanitized.replace(/(\\|\/)+$/, '') + anyEnd,
		});
	});

	test('must be able to build normal directory path when empty strings has been supplied as parameters', () => {
		let test: FolderObject = filterBuilder('', { root: '' });

		expect(test).toEqual({
			file: '',
			anyExtension: true,
			exact: true,
			anyFile: true,
			isComplex: false,
			isNegative: false,
			base: cwd,
			startStr: cwd,
			root: drive,
			reg: new RegExp(cwdSanitized.replace(/(\\|\/)+$/, '') + anyEnd),
			searchStr: cwdSanitized.replace(/(\\|\/)+$/, '') + anyEnd,
		});
	});
});

describe('Testing CWD parameter options', () => {
	test('must be able to receive absolute path for cwd property', () => {
		const folder = 'D:/cwd';
		const test: FolderObject = filterBuilder('', { root: folder });

		expect(test).toMatchObject({
			base: `D:${sep}cwd${sep}`,
			root: `D:${sep}`,
			file: '',
			startStr: `D:${sep}cwd${sep}`,
			reg: new RegExp(`D:${sanSep}cwd${sanSep}${anyEnd}`),
		});
	});

	test('must be able to receive absolute path without root', () => {
		const folder = '/cwd';
		const test: FolderObject = filterBuilder('', { root: folder });

		expect(test).toMatchObject({
			base: `${drive}cwd${sep}`,
			root: drive,
			file: '',
			startStr: `${drive}cwd${sep}`,
			reg: new RegExp(`${drive}cwd${sanSep}`),
		});
	});

	test('must be able to receive dot relative path', () => {
		const folder = './cwd';
		const test: FolderObject = filterBuilder('', { root: folder });

		expect(test).toMatchObject({
			base: `${cwd}cwd${sep}`,
			root: drive,
			file: '',
			startStr: `${cwd}cwd${sep}`,
			reg: new RegExp(`${cwdSanitized}cwd${sanSep}`),
		});
	});

	test('must be able to receive nodot relative path', () => {
		const folder = 'cwd';
		const test: FolderObject = filterBuilder('', { root: folder });

		expect(test).toMatchObject({
			base: `${cwd}cwd${sep}`,
			root: drive,
			file: '',
			startStr: `${cwd}cwd${sep}`,
			reg: new RegExp(`${cwdSanitized}cwd${sanSep}`),
		});
	});

	test('ignore exclamations at start of cwd path', () => {
		const folder = '!D:/cwd';
		const test: FolderObject = filterBuilder('', { root: folder });

		expect(test).toMatchObject({
			base: `D:${sep}cwd${sep}`,
			root: `D:${sep}`,
			file: '',
			startStr: `D:${sep}cwd${sep}`,
			reg: new RegExp(`D:${sanSep}cwd${anyEnd}`),
		});
	});
});

describe('Testing FILE parameter for absolute Path builder', () => {
	test('must be able to deal with relative FILE paths', () => {
		let file = 'some/folder/file.js';
		let resultFile = `some${sanSep}folder${sanSep}file\\.js`;
		let test: FolderObject = filterBuilder(file, { root: cwd });

		expect(test).toMatchObject({
			base: cwd,
			root: drive,
			file: 'some/folder/file.js',
			startStr: `${cwd}some${sep}folder${sep}file.js`,
			searchStr: `${cwdSanitized}${resultFile}`,
			reg: new RegExp(`${cwdSanitized}${resultFile}`),
		});
	});

	test('must be able to deal with relative FILE paths with dot', () => {
		let file = './some/folder/file.js';
		let resultFile = `some${sanSep}folder${sanSep}file\\.js`;
		let test: FolderObject = filterBuilder(file, { root: cwd });

		expect(test).toMatchObject({
			base: cwd,
			root: drive,
			file: './some/folder/file.js',
			startStr: `${cwd}some${sep}folder${sep}file.js`,
			searchStr: `${cwdSanitized}${resultFile}`,
			reg: new RegExp(`${cwdSanitized}${resultFile}`),
		});
	});

	test('must be able to merge absolute paths without root', () => {
		let file = '/some/folder/file.js';
		let resultFile = `some${sanSep}folder${sanSep}file\\.js`;
		let test: FolderObject = filterBuilder(file, { root: cwd });

		expect(test).toMatchObject({
			base: `${drive}`,
			root: drive,
			file: '/some/folder/file.js',
			startStr: `${drive}some${sep}folder${sep}file.js`,
			searchStr: `${sanDrive}${resultFile}`,
			reg: new RegExp(`${sanDrive}${resultFile}`),
		});
	});

	test('must be able to merge absolute paths with root', () => {
		let file = 'D:/some/folder/file.js';
		let resultFile = `some${sanSep}folder${sanSep}file\\.js`;
		let test: FolderObject = filterBuilder(file, { root: cwd });

		expect(test).toMatchObject({
			base: `D:${sep}`,
			root: `D:${sep}`,
			file: 'D:/some/folder/file.js',
			startStr: `D:${sep}some${sep}folder${sep}file.js`,
			searchStr: `D:${sanSep}${resultFile}`,
			reg: new RegExp(`D:${sanSep}${resultFile}`),
		});
	});
	test('test escape instead of /', () => {
		const file = 'a\\b';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b${anyEnd}`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a${sep}b`);
	});
	test('test escape at end of string', () => {
		const file = 'a\\';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${anyEnd}`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a`);
	});
});

describe('STAR char', () => {
	// \*
	// \**a/b**c -> a/b\*c
	test('should include double star dirty start -> a/b**c', () => {
		const file = 'a/b**c';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b\\*c${anyEnd}`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a${sep}b*c`);
	});
	// \**/**a/b -> .*/\*a/b
	test('should include double star dirty end -> **/**a/b', () => {
		const file = '**/**a/b';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}.*${sanSep}\\*a${sanSep}b`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}`);
	});
	// \**a/b -> \*a/b
	test('should include double star dirty end (start) -> **a/b', () => {
		const file = '**a/b';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}\\*a${sanSep}b${anyEnd}`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}*a${sep}b`);
	});
	// \*/**a/b -> [^\\]*/\*a/b
	test('single to double dirty -> */**a/b', () => {
		const file = '*/**a/b';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}[^${sanSep}]*${sanSep}\\*a${sanSep}b`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}`);
	});
	// a**b => a\*b
	test('double middle dirty -> a**b', () => {
		const file = 'a**b';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a\\*b${anyEnd}`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a*b`);
	});
	// b*/c -> b*/c
	test('single star dirty start -> b*/c', () => {
		const file = 'b*/c';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}b[^${sanSep}]*${sanSep}c`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}`);
	});
	// a/b* -> a/b.*
	test('single star dirty start (end) -> a/b*', () => {
		const file = 'a/b*';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b[^${sanSep}]*`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a`);
	});
	// \*a/b -> [^\\]*a/b
	test('single star dirty end -> *a/b', () => {
		const file = '*a/b';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}[^${sanSep}]*a${sanSep}b`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}`);
	});
	// \**/**a/b -> .*/\*a/b
	test('single star dirty end (end) -> a/*b', () => {
		const file = 'a/*b';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}[^${sanSep}]*b`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a`);
	});
	// \**/*a -> .*/[^\\]*a
	test('double-single star dirty -> **/*a', () => {
		const file = '**/*a';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}.*${sanSep}[^${sanSep}]*a`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}`);
	});
	// \**/*a -> .*/[^\\]*a
	test('single-single star dirty -> */*a', () => {
		const file = '*/*a';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}[^${sanSep}]*${sanSep}[^${sanSep}]*a`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}`);
	});
	// a*b -> a[^\\]*b
	test('single star dirty middle -> a*b', () => {
		const file = 'a*b';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a[^${sanSep}]*b`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}`);
	});

	// a/b** -> a/b\*
	test('double star dirty end -> a/b**', () => {
		const file = 'a/b**';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b\\*${anyEnd}`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a${sep}b*`);
	});
	// \** -> .*
	test('double star alone -> a/**', () => {
		const file = 'a/**';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}.*`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a`);
	});
	// \**/* -> .*
	test('double-single star alone -> a/**/*', () => {
		const file = 'a/**/*';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}.*`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a`);
	});
	// \**/*.* -> .*
	test('stars alone full -> a/**/*.*', () => {
		const file = 'a/**/*.*';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}.*`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a`);
	});
	// \**/a -> .*/a
	test('double star before finishing -> **/a', () => {
		const file = '**/a';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}.*${sanSep}a`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}`);
	});
	// a/**/*.js -> .*\.js
	test('double single absolute ext -> a/**/*.js', () => {
		const file = 'a/**/*.js';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}.*\\.js`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a`);
	});
	// \**/*.*js -> .*\.[^\\]*js
	test('double single stared ext (strat) -> **/*.*js', () => {
		const file = '**/*.*js';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}.*\\.[^${sanSep}]*js`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}`);
	});
	// \*.*js -> [^\\]*\.[^\\]*js
	test('single stared ext (start - standalone) -> *.*js', () => {
		const file = '*.*js';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}[^${sanSep}]*\\.[^${sanSep}]*js`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}`);
	});
	// .*js
	test('star ext alone -> .*js', () => {
		const file = '.*js';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}\\.[^${sanSep}]*js`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}`);
	});
	// a/***b -> a\[]*\*b */
	test('triple star dirty end -> a/***b', () => {
		const file = 'a/***b';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}\\**b`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a`);
	});

	// a/*/***b -> a\[]*\*b */
	test('starred tripple star with single folder -> a/*/***b', () => {
		const file = 'a/*/***b';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}[^${sanSep}]*${sanSep}\\**b`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a`);
	});
	// a/b***c -> a\b[]\*c
	test('tripple star dirty start -> a/b***c', () => {
		const file = 'a/b***c';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b[^${sanSep}]*\\*c`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a`);
	});
	// \*.*js -> [^\\]*\.[^\\]*js
	test('ext star end -> a/*.js*', () => {
		const file = 'a/*.js*';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}[^${sanSep}]*\\.js[^${sanSep}]*`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a`);
	});
	// a.*js* => a\.[]js[]
	test('ext in middle of stars -> a.*js*', () => {
		const file = 'a.*js*';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a\\.[^${sanSep}]*js[^${sanSep}]*`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}`);
	});
	// \*.*js -> [^\\]*\.[^\\]*js
	test('double starred ext -> a.**js', () => {
		const file = 'a.**js';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a\\.\\*js`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a.*js`);
	});
	// a/b**.js -> a/b\*.js
	test('double starred file -> a/b**.js', () => {
		const file = 'a/b**.js';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b\\*\\.js`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a${sep}b*.js`);
	});
	// a/b*.js** -> a/b[].js\*
	test('double starred in ext end -> a/b*.js**', () => {
		const file = 'a/*.js**';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}[^${sanSep}]*\\.js\\*`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a`);
	});
	// a/b*.js** -> a/b[].js\*
	test('triple starred in ext end -> a/b*.js.***', () => {
		const file = 'a/*.js.***';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}[^${sanSep}]*\\.js\\.\\**`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a`);
	});

	test('STAR should be able to work with code -> *{b}', () => {
		const file = 'a/b*{c}';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b(c)*`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a`);
	});
	test('STAR should be able to work with code -> b*[c]', () => {
		const file = 'a/b*[c]';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b[c]*`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a`);
	});
	test('STAR should be able to work with code -> b*(c)', () => {
		const file = 'a/b*(c)';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b(c)*`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a`);
	});
	test('STAR should be able to work with star inside code -> b(c*)', () => {
		const file = 'a/b@(c*)';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b(c*)`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a`);
	});
	test('STAR should be able to work with double star before code -> b**(c)', () => {
		const file = 'a/b**(c)';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b\\*\\(c\\)${anyEnd}`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a${sep}b*(c)`);
	});
	test('STAR should be able to work with escaped star before code -> b\\*(c)', () => {
		const file = 'a/b\\*(c)';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b\\*\\(c\\)${anyEnd}`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a${sep}b*(c)`);
	});
	test('STAR should be able to work with hard code -> b*<c>', () => {
		const file = 'a/b*<c>';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b[^${sanSep}]*c`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a`);
	});

	test('STAR doubles slash -> /**//*', () => {
		const file = 'a/**\\\\*';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}.*${sanSep}[^${sanSep}]*`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a`);
	});
});

describe('should be able to deal with PLUS characters', () => {
	// \*
	// +abc => \+abc$
	test('should include + as literal to start of string -> +abc', () => {
		const file = 'a/+b';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}\\+b${anyEnd}`;

		expect(test.searchStr).toBe(result);
	});
	// abc+def => abc+def$
	test('should include string plust string -> abc+def', () => {
		const file = 'a/b+c';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b\\+c${anyEnd}`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a${sep}b+c`);
	});
	// abc+ => abc+
	test('should include string plus -> abc+', () => {
		const file = 'a/b+';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b\\+${anyEnd}`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a${sep}b+`);
	});
	// abc++def => abc\+def
	test('should include string double plus -> abc++def or abc++', () => {
		const file = 'a/b++c';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b+c`;

		expect(test.searchStr).toBe(result);
	});
	// abc++def => abc\+def
	test('should include string double plus (no start string) -> ++def or \\++def', () => {
		const file = 'a/++c';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}\\+\\+c${anyEnd}`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a${sep}++c`);
	});
	test('plus should be escapable', () => {
		const file = 'a/b\\+c';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b\\+c${anyEnd}`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a${sep}b+c`);
	});
	test('plus should be added inside patters or code', () => {
		const file = 'a/b@{c+}';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b(c+)`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a`);
	});

	// * ROUND BRACKETS

	// +() => ()+
	test('should include single plus Round Bracket -> +(b)', () => {
		const file = 'a/+(b)';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}(b)+`;

		expect(test.searchStr).toBe(result);
	});
	// a++(b) => a+(b)
	test('should include double plus Round Bracket -> b++(c)', () => {
		const file = 'a/b++(c)';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b+\\(c\\)`;

		expect(test.searchStr).toBe(result);
	});

	// ++(b) => \++(b)
	test('should include double plus Round Bracket (no start string) -> ++(b)', () => {
		const file = 'a/++(b)';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}\\+(b)+`;

		expect(test.searchStr).toBe(result);
	});
	// a+++(b) => a+(b)+
	test('should include tripple plus Round Bracket -> b+++(c)', () => {
		const file = 'a/b+++(c)';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b+(c)+`;

		expect(test.searchStr).toBe(result);
	});
	// +++(a) => \++(a)+
	test('should include tripple plus Round Bracket (no start string) -> +++(b)', () => {
		const file = 'a/+++(b)';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}\\++\\(b\\)`;

		expect(test.searchStr).toBe(result);
	});
	// a+++++++++++(b) => a\++(b)+
	test('should include multiple plus Round Bracket -> b++++++(c)', () => {
		const file = 'a/b+++++++(c)';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b+\\++\\+(c)+`;

		expect(test.searchStr).toBe(result);
	});

	// * CURLY BRACKETS

	// +{} => ()+
	test('should include single plus curly Bracket -> +{}', () => {
		const file = 'a/+{b}';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}(b)+`;

		expect(test.searchStr).toBe(result);
	});
	// a++{b} => a+(b)+
	test('should include double plus curly Bracket -> b++{c}', () => {
		const file = 'a/b++{c}';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b+\\{c\\}`;

		expect(test.searchStr).toBe(result);
	});
	// ++{a} => \+(a)+
	test('should include double plus curly Bracket (no start string) -> ++{b}', () => {
		const file = 'a/++{b}';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}\\+(b)+`;

		expect(test.searchStr).toBe(result);
	});
	// a+++{b} => a+(b)+
	test('should include triple plus curly Bracket -> b+++{c}', () => {
		const file = 'a/b+++{c}';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b+(c)+`;

		expect(test.searchStr).toBe(result);
	});
	// +++{a} => \++(a)+
	test('should include triple plus curly Bracket (empty start string) -> +++{b}', () => {
		const file = 'a/+++{c}';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}\\++\\{c\\}`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a`);
	});
	// a+++++++++++{b} => a\++(b)+
	test('should include multiple plus curly Bracket -> b+++++++{c}', () => {
		const file = 'a/b++++++{c}';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b+\\++(c)+`;

		expect(test.searchStr).toBe(result);
	});

	// * SQUARE BRACKETS
	// +[] => []+
	test('should include single plus square Bracket -> +[]', () => {
		const file = 'a/+[b]';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}[b]+`;

		expect(test.searchStr).toBe(result);
	});
	// a++[b] => a+[b]
	test('should include double plus square Bracket -> b++[c]', () => {
		const file = 'a/b++[c]';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b+\\[c\\]`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a`);
	});

	// ++[b] => \++(b)
	test('should include double plus square Bracket (no start string) -> ++[b]', () => {
		const file = 'a/++[b]';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}\\+[b]+`;

		expect(test.searchStr).toBe(result);
	});
	// a+++[b] => a+[b]+
	test('should include triple plus square Bracket -> b+++[c]', () => {
		const file = 'a/b+++[c]';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b+[c]+`;

		expect(test.searchStr).toBe(result);
	});
	// +++[a] => \++\[a\]
	test('should include triple plus square Bracket (no start string) -> +++[b]', () => {
		const file = 'a/+++[b]';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}\\++\\[b\\]`;

		expect(test.searchStr).toBe(result);
	});
	// a+++++++++++[b] => a\++[b]+
	test('should include multiple plus square Bracket -> +++++++[]', () => {
		const file = 'a/b+++++++[c]';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b+\\++\\+[c]+`;

		expect(test.searchStr).toBe(result);
	});

	// * CODE BRACKETS
	// +<> => ()+
	test('should include single plus arrow Bracket -> +<B>', () => {
		const file = 'a/+<b>';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}\\+b`;

		expect(test.searchStr).toBe(result);
	});
	// a++<b> => a+(b)
	test('should include double plus square Bracket -> b++<c>', () => {
		const file = 'a/b++<c>';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b+c`;

		expect(test.searchStr).toBe(result);
	});
	// ++<b> => \++(b)
	test('should include double plus arrow Bracket (no start string) -> ++<b>', () => {
		const file = 'a/++<b>';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}\\+\\+b`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a`);
	});
	// a+++<b> => a+(b)+
	test('should include triple plus arrow Bracket -> b+++<c>', () => {
		const file = 'a/b+++<c>';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b+\\+c`;

		expect(test.searchStr).toBe(result);
	});
	// +++<a> => \++(a)+
	test('should include triple plus arrow Bracket (no start string) -> +++<b>', () => {
		const file = 'a/+++<b>';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}\\++b`;

		expect(test.searchStr).toBe(result);
	});
	// a+++++++++++<b> => a\++(b)+
	test('should include multiple plus arrow Bracket -> b++++<c>', () => {
		const file = 'a/b+++++<c>';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b+\\++c`;

		expect(test.searchStr).toBe(result);
	});
});

describe('should be able to deal with DOLLAR character $', () => {
	// abc$def => abc\$def
	test('should be able to escape DOLAR in string => b$c', () => {
		const file = 'a/b$c';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b\\$c${anyEnd}`;

		expect(test.searchStr).toBe(result);
	});
	// abc$ => abc$ ... end of string
	test("don't escape DOLAR at end of string => bc$", () => {
		const file = 'a/bc$';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}bc$${anyEnd}`;

		expect(test.searchStr).toBe(result);
	});
	// (abc$) => (abc$) => don't escape in code
	test("don't escape DOLAR inside code => (b$c)", () => {
		const file = 'a/d@(b$c)';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}d(b$c)`;

		expect(test.searchStr).toBe(result);
	});
	// $() => () => atleast 1
	test('create code with DOLAR round bracket => b$(c)', () => {
		const file = 'a/b$(c)';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b(c)`;

		expect(test.searchStr).toBe(result);
	});
	// ${} => () => atleast 1
	test('create code with DOLAR curly bracket => b${c}', () => {
		const file = 'a/b${c}';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b(c)`;

		expect(test.searchStr).toBe(result);
	});
	// $[] => () => atleast 1
	test('create square bracket code with DOLAR square bracket => b$[c]', () => {
		const file = 'a/b$[c]';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b[c]`;

		expect(test.searchStr).toBe(result);
	});
	// $<> => () => atleast 1
	test('create hard code with DOLAR arrow bracket => b$<c>', () => {
		const file = 'a/b$<c>';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b\\$c`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a`);
	});
	test('Escape dollar => b\\$c', () => {
		const file = 'a/b\\$c';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b\\$c${anyEnd}`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a${sep}b$c`);
	});
	test('next folder dollar => b/$c', () => {
		const file = 'a/b/$c';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b${sanSep}\\$c${anyEnd}`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a${sep}b${sep}$c`);
	});
});

describe('should be able to deal with AT character @', () => {
	// abc@def => abc@def
	test('should be able to deal normally with @ inside string => b@c', () => {
		const file = 'a/b@c';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b@c${anyEnd}`;

		expect(test.searchStr).toBe(result);
	});
	// @abc => @abc
	test('should be able to deal normally with @ at start of string => @b', () => {
		const file = 'a/@b';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}@b${anyEnd}`;

		expect(test.searchStr).toBe(result);
	});
	// abc\@def => abc@def -> no need to escape

	// @() => () => atleat 1
	test('create code with AT round bracket => b@(c)', () => {
		const file = 'a/b@(c)';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b(c)`;

		expect(test.searchStr).toBe(result);
	});
	// @{} => () => atleat 1
	test('create code with AT curly bracket => b@{c}', () => {
		const file = 'a/b@{c}';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b(c)`;

		expect(test.searchStr).toBe(result);
	});
	// @<> => () => atleat 1
	test('create hard code with AT arrow bracket => b@<c>', () => {
		const file = 'a/b@<c>';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b@c`;

		expect(test.searchStr).toBe(result);
	});
	// @[] => [] => atleat 1
	test('create square bracket code with AT square bracket => b@[c]', () => {
		const file = 'a/b@[c]';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b[c]`;

		expect(test.searchStr).toBe(result);
	});

	test('deal with @ inside code => b[@c]', () => {
		const file = 'a/b@[@c]';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b[@c]`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a`);
	});
});

describe('should be able to deal with QUESTION MARK character ?', () => {
	// abc?def => abc?def
	test('should be able to deal normally with QUESTION inside string => b?c', () => {
		const file = 'a/b?c';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b\\?c${anyEnd}`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a${sep}b?c`);
	});
	// abc? => abc?
	test('should be able to deal normally with QUESTION at end of string => b?', () => {
		const file = 'a/b?';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b\\?${anyEnd}`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a${sep}b?`);
	});
	// abc? => abc?
	test('should escape QUESTION at beginning of string => ?b', () => {
		const file = 'a/?b';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}\\?b${anyEnd}`;

		expect(test.searchStr).toBe(result);
	});
	// abc??def => abc\\?def
	test('should escape double QUESTION marks inside string => b??c', () => {
		const file = 'a/b??c';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b?c`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a`);
	});
	// abc?? => abc\\?
	test('should escape double QUESTION marks at end of string => b??c', () => {
		const file = 'a/b??';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b?`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a`);
	});
	// ?abc => \?abc
	test('should be able to escape QUESTION MARK at start of string => ?b', () => {
		const file = 'a/?b';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}\\?b${anyEnd}`;

		expect(test.searchStr).toBe(result);
	});
	// ??abc => \?\?abc
	test('should escape double QUESTION marks at start of string => ??b', () => {
		// should be regex ?
		const file = 'a/??b';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}\\?\\?b${anyEnd}`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a${sep}??b`);
	});
	// (??b) => (??b)
	test("don't escape QUESTION marks inside code => @(b??)", () => {
		const file = 'a/@(b??)';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}(b??)`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a`);
	});
	// (b\?c) => (b\?c)
	test('escape QUESTION marks => b\\?c', () => {
		const file = 'a/b\\?c';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b\\?c${anyEnd}`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a${sep}b?c`);
	});
	// \?c => \\?c
	test('escape QUESTION marks at start of string => \\?c', () => {
		const file = 'a/\\?c';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}\\?c${anyEnd}`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a${sep}?c`);
	});
	// ?() => ()? (0 or 1)
	test('create code with QUESTION mark round brackets => ?(b)', () => {
		const file = 'a/?(b)';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}(b)?`;

		expect(test.searchStr).toBe(result);
	});
	// ?{} => ()? (0 or 1)
	test('create code with QUESTION mark curly brackets => ?{b}', () => {
		const file = 'a/?{b}';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}(b)?`;

		expect(test.searchStr).toBe(result);
	});
	// ?<> => ()? (0 or 1)
	test('create hard code with QUESTION mark arrow brackets => ?<b>', () => {
		const file = 'a/?<b>';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}\\?b`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a`);
	});
	// ?[] => []? (0 or 1)
	test('create square bracket code with QUESTION mark square brackets => ?[b]', () => {
		const file = 'a/?[b]';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}[b]?`;

		expect(test.searchStr).toBe(result);
	});

	test('deal with tripple QUESTION marks =>  b???', () => {
		const file = 'a/b???';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b?\\?`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a`);
	});
});

describe('should be able to deal with EXCLAMATION MARK character !', () => {
	// \!
	test('should create negative with EXCLAMATION start => !a', () => {
		const file = '!a/b';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b${anyEnd}`;
		expect(test).toMatchObject({
			searchStr: result,
			reg: new RegExp(result),
			isNegative: true,
		});
	});
	// a!b
	test('should not create negative with EXCLAMATION inside string => b!c', () => {
		const file = 'a/b!c';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b!c${anyEnd}`;
		expect(test).toMatchObject({
			searchStr: result,
			isNegative: false,
		});
	});

	// \!() => (?!)
	test('create negative code with EXCLAMATION round bracket => !(b)', () => {
		const file = 'a/!(b)';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}(?!b)`;
		expect(test).toMatchObject({
			searchStr: result,
			isNegative: false,
		});
	});
	// \!{} => (?!)
	test('create negative code with EXCLAMATION curly bracket => !{b}', () => {
		const file = 'a/!{b}';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}(?!b)`;
		expect(test).toMatchObject({
			searchStr: result,
			isNegative: false,
		});
	});
	// \![] => [^]
	test('create negative square code with EXCLAMATION square bracket => ![b]', () => {
		const file = 'a/![b]';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}[^b]`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a`);
	});
	test('EXCLAMATION inside code => (!b)', () => {
		const file = 'a/@(!b)';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}(!b)`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a`);
	});
	test('normal string -> EXCLAMATION + square bracket => \\![b]', () => {
		const file = 'a/\\![b]';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}!\\[b\\]${anyEnd}`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a${sep}![b]`);
	});
	// \!<> => (?!)
	test('ignore EXCLAMATION before arrow bracket => !<b>', () => {
		const file = 'a/!<b>';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}!b`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a`);
	});
});

describe('should be able to deal with DOTs .', () => {
	// abc.def => abc\.def
	test('should escape dots inside of strings => b.c', () => {
		const file = 'a/b.c';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b\\.c`;
		expect(test.searchStr).toBe(result);
	});
	// abc. => abc\.
	test('should escape dots at end of strings => b.', () => {
		const file = 'a/b.';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b\\.${anyEnd}`;

		expect(test.searchStr).toBe(result);
	});
	// .def => \.def
	test('should escape dots at start of strings => .b', () => {
		const file = 'a/.b';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}\\.b${anyEnd}`;

		expect(test.searchStr).toBe(result);
	});
	// abc..def => abc.def
	test("don't escape double dots inside start of string => b..c", () => {
		const file = 'a/b..c';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b.c`;

		expect(test.searchStr).toBe(result);
	});
	// abc.. => abc.
	test("don't escape double dots at end of string => b..", () => {
		const file = 'a/b..';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b.`;

		expect(test.searchStr).toBe(result);
	});
	// ..def => .def
	test("don't escape double dots at start of string => ..b", () => {
		const file = 'a/..b';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}.b`;

		expect(test.searchStr).toBe(result);
	});
	// (abc.def) => (abc.def)
	test("don't escape double dots at start of code => @(..b)", () => {
		const file = 'a/@(..b)';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}(..b)`;

		expect(test.searchStr).toBe(result);
	});
	// a/../c => c
	test('remove folder that is followed by double dot => a/../', () => {
		const file = 'a/../b';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}b${anyEnd}`;

		expect(test.searchStr).toBe(result);
	});
	// a/../c => c
	test('remove folder that is followed by double dot at end of string => a/..', () => {
		const file = 'b/..';
		const root = 'D:/a';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${anyEnd}`;

		expect(test.searchStr).toBe(result);
	});
	// a/../c => c
	test('remove folder from cwd also that is followed by double dot => a/../../b', () => {
		const file = 'a/../../b';
		const root = 'D:/cwd';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}b${anyEnd}`;

		expect(test.searchStr).toBe(result);
	});
	// a/../c => c
	test('never remove root folder => a/../../b', () => {
		const file = 'a/../../b';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}b${anyEnd}`;

		expect(test.searchStr).toBe(result);
	});
});

describe('brackets without start', () => {
	// a/(abc) => a/\(abc\)
	test('escape single round bracket => a/(b)', () => {
		const file = 'a/(b)';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}\\(b\\)${anyEnd}`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a${sep}(b)`);
	});
	// a/((abc)) => a/(abc)
	test("don't escape double round bracket => a/((b))", () => {
		const file = 'a/((b))';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}(b)`;

		expect(test.searchStr).toBe(result);
	});
	// a/(abc) => a/\(abc\)
	test('escape single square bracket => a/[b]', () => {
		const file = 'a/[b]';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}\\[b\\]${anyEnd}`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a${sep}[b]`);
	});
	// a/[[abc]] => a/[[abc]]
	test("don't escape double round bracket => a/[[b]]", () => {
		const file = 'a/[[b]]';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}[b]`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a`);
	});
	// a/(abc) => a/\(abc\)
	test('escape single curly bracket => a/{b}', () => {
		const file = 'a/{b}';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}\\{b\\}${anyEnd}`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a${sep}{b}`);
	});
	// a/((abc)) => a/(abc)
	test("don't escape double curly bracket => a/{{b}}", () => {
		const file = 'a/{{b}}';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}(b)`;

		expect(test.searchStr).toBe(result);
		expect(test.startStr).toBe(`D:${sep}a`);
	});
	// a/(abc) => a/\(abc\)
	test('hard code arrow brackets => a/<b>', () => {
		const file = 'a/<b>';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}b`;

		expect(test.searchStr).toBe(result);
	});

	test('brackets inside brackets -> (c(b)d)', () => {
		const file = 'a/<c(b)d>';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}c(b)d`;

		expect(test.searchStr).toBe(result);
	});
	test('brackets inside brackets - @', () => {
		const file = 'a/@{c(b)d}';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}(c(b)d)`;

		expect(test.searchStr).toBe(result);
	});
	test('brackets inside brackets - double bracket ()', () => {
		const file = 'a/((c(/b)d))';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}(c(/b)d)`;

		expect(test.searchStr).toBe(result);
	});
	test('brackets inside brackets - double bracket {}', () => {
		const file = 'a/{{c[\\e]d}}';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}(c[\\\\e]d)`;

		expect(test.searchStr).toBe(result);
	});
	test('mixed double brackets', () => {
		const file = 'a/{(c[e]d)}';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}\\{\\(c\\[e\\]d\\)\\}`;

		expect(test.searchStr).toBe(result);
	});
	test('arrow brackets inside hardcode - double bracket << >>', () => {
		const file = 'a/<c<b>d>';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });
		const result = `D:${sanSep}a${sanSep}c<b>d`;

		expect(test.searchStr).toBe(result);
	});
});

describe('aditional info', () => {
	test('must be exact', () => {
		const file = 'a/b';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });

		expect(test.exact).toBe(true);
		expect(test.anyFile).toBe(true);
		expect(test.anyFolder).toBeFalsy();
		expect(test.anyExtension).toBe(true);
		expect(test.ext).toBeFalsy();
	});
	test('must be anyfolder', () => {
		const file = 'a/**';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });

		expect(test.exact).toBeFalsy();
		expect(test.anyFolder).toBe(true);
		expect(test.anyFile).toBe(true);
		expect(test.anyExtension).toBe(true);
		expect(test.ext).toBeFalsy();
	});
	test('must be anyFile', () => {
		const file = 'a/*';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });

		expect(test.exact).toBeFalsy();
		expect(test.anyFolder).toBeFalsy();
		expect(test.anyFile).toBe(true);
		expect(test.anyExtension).toBe(true);
		expect(test.ext).toBeFalsy();
	});
	test('must be anyExtension', () => {
		const file = 'a/*.*';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });

		expect(test.exact).toBeFalsy();
		expect(test.anyFolder).toBeFalsy();
		expect(test.anyFile).toBe(true);
		expect(test.anyExtension).toBe(true);
		expect(test.ext).toBeFalsy();
	});
	test('must have ext', () => {
		const file = 'a/*.js';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });

		expect(test.exact).toBeFalsy();
		expect(test.anyFolder).toBeFalsy();
		expect(test.anyFile).toBe(true);
		expect(test.anyExtension).toBeFalsy();
		expect(test.ext).toBe('.js');
	});
	test('must have all', () => {
		const file = 'a/**/*.*';
		const root = 'D:/';
		const test: FolderObject = filterBuilder(file, { root });

		expect(test.exact).toBeFalsy();
		expect(test.anyFolder).toBe(true);
		expect(test.anyFile).toBe(true);
		expect(test.anyExtension).toBe(true);
		expect(test.ext).toBeFalsy();
	});
});

// Testing FolderFilter
describe('using default options in GETFILTERS', () => {
	test("default constructor -> ''", () => {
		const result = getFilters('');
		expect(result).toEqual({
			start: [],
			posString: '',
			negString: '',
			positive: [],
			negative: [],
			ignore: [],
		});
	});
	test('default constructor -> []', () => {
		const result = getFilters([]);
		expect(result).toEqual({
			start: [],
			posString: '',
			negString: '',
			positive: [],
			negative: [],
			ignore: [],
		});
	});
	test('value string', () => {
		const value = 'a/b/**/*';
		const result = getFilters(value);
		const sanVal = `${cwdSanitized}a${sanSep}b${sanSep}.*`;
		const val = `${cwd}a${sep}b`;
		const reg = new RegExp(sanVal);
		expect(result).toEqual({
			positive: [
				{
					file: 'a/b/**/*',
					isNegative: false,
					base: cwd,
					root: drive,
					anyFolder: true,
					isComplex: false,
					startStr: val,
					searchStr: sanVal,
					reg: reg,
					anyExtension: true,
					anyFile: true,
				},
			],
			negative: [],
			posString: sanVal,
			start: [val],
			negString: '',
			posReg: reg,
			ignore: [],
		});
	});
	test('value negative string', () => {
		const value = '!a/b/**/*';
		const result = getFilters(value);
		const sanVal = `${cwdSanitized}a${sanSep}b${sanSep}.*`;
		const val = `${cwd}a${sep}b`;
		const reg = new RegExp(sanVal);

		expect(result).toEqual({
			negative: [
				{
					file: '!a/b/**/*',
					isNegative: true,
					base: cwd,
					root: drive,
					isComplex: false,
					anyFolder: true,
					anyFile: true,
					anyExtension: true,
					startStr: val,
					searchStr: sanVal,
					reg: reg,
				},
			],
			positive: [],
			negString: sanVal,
			start: [],
			posString: '',
			negReg: reg,
			ignore: [val],
		});
	});
	test('value []', () => {
		const value = ['!a/b/**/*.js', '!a/b/c.js', 'a/c/b', 'a/c/**'];
		const result = getFilters(value);

		expect(result.positive.length).toBe(1);
		expect(result.negative.length).toBe(1);
		expect(result.posString).toBe(`${cwdSanitized}a${sanSep}c${sanSep}.*`);
		expect(result.negString).toBe(`${cwdSanitized}a${sanSep}b${sanSep}.*\\.js`);
		expect(result.start).toEqual([`${cwd}a${sep}c`]);
	});

	test('multiple values [], but in reverse order from before', () => {
		const value = ['!a/b/c.js', '!a/b/**/*.js', 'a/c/**', 'a/c/b.js'];
		const result = getFilters(value);

		expect(result.positive.length).toBe(1);
		expect(result.negative.length).toBe(1);
		expect(result.posString).toBe(`${cwdSanitized}a${sanSep}c${sanSep}.*`);
		expect(result.negString).toBe(`${cwdSanitized}a${sanSep}b${sanSep}.*\\.js`);
		expect(result.start).toEqual([`${cwd}a${sep}c`]);
	});

	test('multiple values [], but ignore complex types', () => {
		const value = ['a/**/*.*', 'a/**/a.js', 'a/b/*.js', 'a/b/c.js'];
		const result = getFilters(value);

		expect(result.positive.length).toBe(2);
		expect(result.posString).toBe(
			`${cwdSanitized}a${sanSep}.*|${cwdSanitized}a${sanSep}.*${sanSep}a\\.js`,
		);
		expect(result.start).toEqual([`${cwd}a`]);
	});
	test('multiple Different Values []', () => {
		const value = ['!a/b', '!a/c', 'a/d', 'a/e'];
		const result = getFilters(value);

		expect(result.positive.length).toBe(2);
		expect(result.negative.length).toBe(2);
		expect(result.posString).toBe(
			`${cwdSanitized}a${sanSep}d${anyEnd}|${cwdSanitized}a${sanSep}e${anyEnd}`,
		);
		expect(result.negString).toBe(
			`${cwdSanitized}a${sanSep}b${anyEnd}|${cwdSanitized}a${sanSep}c${anyEnd}`,
		);
		expect(result.start).toEqual([`${cwd}a${sep}d`, `${cwd}a${sep}e`]);
	});
	test('multiple same negative and positive', () => {
		const value = ['!a/b/**', 'a/b/c'];
		const result = getFilters(value);
		expect(result.positive.length).toBe(0);
		expect(result.negative.length).toBe(1);
		expect(result.ignore.length).toBe(1);
	});
});

describe('using options in GETFILTERS', () => {
	test('cwd property', () => {
		const file = 'a';
		const root = 'D:/';
		const result = getFilters(file, { root });

		expect(result.positive.length).toBe(1);
		expect(result.posString).toBe(`D:${sanSep}a${anyEnd}`);
		expect(result.start).toEqual([`D:${sep}a`]);
	});
	test('no unique values', () => {
		const file = ['a/**', 'a/**'];
		const unique = false;
		const result = getFilters(file, { unique });

		expect(result.positive.length).toBe(2);
		expect(result.posString).toBe(`${cwdSanitized}a${sanSep}.*|${cwdSanitized}a${sanSep}.*`);
		expect(result.start).toEqual([`${cwd}a`]);
	});
	test('all options', () => {
		const file = ['a/**', 'a/**'];
		const root = 'D:/';
		const unique = false;
		const result = getFilters(file, { root, unique });

		expect(result.positive.length).toBe(2);
		expect(result.posString).toBe(`D:${sanSep}a${sanSep}.*|D:${sanSep}a${sanSep}.*`);
		expect(result.start).toEqual([`D:${sep}a`]);
	});
});
