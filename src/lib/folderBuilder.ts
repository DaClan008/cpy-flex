import { readdir, readdirSync, Dirent, existsSync } from 'fs';
import { join, sep, resolve } from 'path';
import { FolderBuilderOptions, FolderInfo, ErrorOptions } from './objects';
import { errorHandler } from './errorHandler';

export function fixFiles(files: string[], root: string, noFix = false): string[] {
	const newArr: string[] = [];
	const test = /^([a-zA-Z]:)/.exec(root);
	let rootDir = '';
	if (test) [, rootDir] = test;

	files.forEach(file => {
		if (!file) return;
		let wrkFile = file.replace(/(\\+|\/+)/g, sep);
		if (wrkFile.charAt(wrkFile.length - 1) === sep) wrkFile = wrkFile.slice(0, -1);
		if (!noFix) {
			let indx = 0;
			let char = wrkFile.charAt(indx);
			let relative = false;
			if (char === '!') char = wrkFile.charAt(++indx);
			if (char === '.') {
				relative = true;
				char = wrkFile.charAt(++indx);
			}
			if ((char === sep && !relative) || wrkFile.charAt(indx + 1) === ':') {
				// we have absolute path
				// if (indx >= 0) wrkFile = wrkFile.slice(char === path.sep ? indx + 1 : indx);
				if (indx > 0) wrkFile = wrkFile.slice(indx);
				if (char === sep) newArr.push(`${rootDir}${wrkFile}`);
				else newArr.push(wrkFile);
			} else {
				// we have relative path
				if (char !== sep) indx--;
				if (indx >= 0) wrkFile = wrkFile.slice(indx + 1);
				newArr.push(`${root}${wrkFile ? sep : ''}${wrkFile}`);
			}
		} else newArr.push(wrkFile);
	});
	return newArr;
}

function buildFolderObject(
	files: Dirent[],
	startStr: string,
	ignoreList: string[],
	rootLen: number,
	startLen: number,
	negReg: RegExp,
): FolderInfo[] {
	const arr: FolderInfo[] = [];
	files.forEach(file => {
		const obj: FolderInfo = {
			name: file.name,
			fullName: join(startStr, file.name),
			isFolder: file.isDirectory(),
			info: file,
			parent: startStr,
			ext: '',
			longExt: '',
			longName: file.name,
			shortName: file.name,
			fromRoot: startStr.slice(rootLen + 1),
			fromStart: startStr.slice(startLen),
		};
		// see if we should add folders
		if (
			(obj.isFolder && ignoreList.indexOf(obj.fullName) > -1) ||
			(negReg && negReg.test(obj.fullName))
		) {
			obj.ignoreFolder = true;
		}
		// get correct extension.
		if (!obj.isFolder) {
			let tmpExt = '';
			for (let i = file.name.length - 1; i >= 0; i--) {
				const char = file.name[i];
				if (char === '.') {
					if (obj.ext) obj.longExt = `.${tmpExt}`;
					else {
						obj.ext = `.${tmpExt}`;
						obj.longExt = `.${tmpExt}`;
					}
				}
				tmpExt = char + tmpExt;
			}
			obj.longName = obj.name.slice(0, -obj.ext.length);
			obj.shortName = obj.name.slice(0, -obj.longExt.length);
		}
		arr.push(obj);
	});
	return arr;
}

function errorHandle(
	error: Error,
	folderStr: string,
	options: FolderBuilderOptions,
	rootLen: number,
	startLen: number,
	negReg: RegExp,
): FolderInfo[] | never {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	if ((error as any).code === 'ENOTDIR') {
		if (existsSync(folderStr)) {
			if (negReg && negReg.test(folderStr)) return [];
			const folderSplit = folderStr.split(sep);
			const file = folderSplit.pop();
			const folder = folderSplit.join(sep);
			const [, name, ext] = /(.*)(\..*)/.exec(file);
			const [, shortname, longext] = /([^.]*)(\..*)/.exec(file);
			return [
				{
					name: file,
					fullName: folderStr,
					isFolder: false,
					info: undefined,
					parent: folder,
					ext: ext || '',
					longExt: longext || '',
					longName: name || '',
					shortName: shortname || '',
					fromRoot: folder.slice(rootLen + 1),
					fromStart: folder.slice(startLen + 1),
				},
			];
		}
		errorHandler(error, options);
		return [];
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	if ((error as any).code === 'ENOENT') {
		const err: Error = { ...error, message: `no such file or directory '${folderStr}'` };
		errorHandler(err, options);
		if (options.noStartFix && options.errorHandle && options.errorHandle === ErrorOptions.log) {
			console.log("SUGGEST: setting 'noStartFix' option to false.");
		}
		return [];
	}
	/* istanbul ignore next */
	throw error;
}
export function getFoldersSync(
	startStr = '',
	options: FolderBuilderOptions = {},
	rootLen?: number,
	startLen?: number,
): FolderInfo[] {
	let {
		// eslint-disable-next-line prefer-const
		negReg = options.negString ? new RegExp(options.negString) : undefined,
		// eslint-disable-next-line prefer-const
		root: rt = process.cwd(),
		ignoreList = [],
	} = options;
	const root = resolve(rt);
	const strt = fixFiles([startStr], root, options.noStartFix)[0];
	if (!strt) return [];
	const rLen = rootLen || (root.indexOf(strt) ? root.length : 2);
	const sLen = startLen || strt.length;
	let folderInfo: Dirent[] = [];
	// get folders
	try {
		folderInfo = readdirSync(strt, { withFileTypes: true });
	} catch (error) {
		return errorHandle(error, strt, options, rLen, sLen, negReg);
	}
	// fix ignores
	if (ignoreList.length > 0) ignoreList = fixFiles(ignoreList, root, options.noIgnoreFix);
	// get folderObjects
	const result = buildFolderObject(folderInfo, strt, ignoreList, rLen, sLen, negReg);
	// get all folders inside other folders
	if (!options.noRecursive) {
		const newOptions = {
			...options,
			ignoreList: ignoreList,
			noIgnoreFix: true,
			noStartFix: true,
			negReg: negReg,
		};

		result
			.filter(info => info.isFolder && !info.ignoreFolder)
			.forEach(val => result.push(...getFoldersSync(val.fullName, newOptions, rLen, sLen)));
	}

	return result;
}
export async function getFolders(
	startStr = '',
	options: FolderBuilderOptions = {},
	rootLen?: number,
	startLen?: number,
): Promise<FolderInfo[]> {
	let {
		// eslint-disable-next-line prefer-const
		negReg = options.negString ? new RegExp(options.negString) : undefined,
		// eslint-disable-next-line prefer-const
		root: rt = process.cwd(),
		ignoreList = [],
	} = options;
	const root = resolve(rt);
	const strt = fixFiles([startStr], root, options.noStartFix)[0];
	if (!strt) return [];
	const rLen = rootLen || (root.indexOf(strt) ? root.length : 2);
	const sLen = startLen || strt.length;
	let folderInfo: Dirent[] = [];

	// get folders
	try {
		folderInfo = await new Promise((res, rej) => {
			const cb = (err: Error, val: Dirent[]): void => {
				if (err) return rej(err);
				return res(val);
			};
			readdir(strt, { withFileTypes: true }, cb);
		});
	} catch (error) {
		return errorHandle(error, strt, options, rLen, sLen, negReg);
	}
	// fix ignores
	if (ignoreList.length > 0) ignoreList = fixFiles(ignoreList, root, options.noIgnoreFix);
	// get folderObjects
	const result = buildFolderObject(folderInfo, strt, ignoreList, rLen, sLen, negReg);
	// get all folders inside other folders
	if (!options.noRecursive) {
		const newOptions: FolderBuilderOptions = {
			...options,
			ignoreList: ignoreList,
			noIgnoreFix: true,
			noStartFix: true,
			negReg: negReg,
		};
		await Promise.all(
			result
				.filter(info => info.isFolder && !info.ignoreFolder)
				.map(val => getFolders(val.fullName, newOptions, rLen, sLen)),
		).then(promArr => promArr.forEach(infoArr => result.push(...infoArr)));
	}

	return result;
}
