import { join, resolve, sep } from 'path';
import { copyFile, copyFileSync, mkdirSync, constants, existsSync } from 'fs';
import { Options, ListObject, FolderInfo, PreserveState, OverWrightEnum } from './lib/objects';
import { getFilters } from './lib/filter';
import { getFoldersSync, getFolders } from './lib/folderBuilder';
import { errorHandler } from './lib/errorHandler';

function getName(itm: FolderInfo, options: Options): NameObject {
	const { name, ext, longExt, longName, shortName } = itm;
	const { rename, longExtension } = options;
	const nme = longExtension ? shortName : longName;
	const ex = longExtension ? longExt : ext;
	const Name: NameObject = {
		name: nme,
		ext: ex,
		fullName: name,
	};
	if (rename) {
		// name
		const namePat = rename.namePat
			? rename.namePat.replace(/(\.|\*|\$|\\|\/)/g, '\\$1')
			: undefined;
		if ((namePat && new RegExp(namePat).test(name)) || !namePat) {
			if (rename.name) {
				if (!rename.removeExt) {
					Name.name = rename.name;
				} else {
					Name.ext = '';
					const pat = longExtension ? /(\.?[^.]+)(\..*)/ : /(.*)(\..*)/;
					const test = pat.exec(rename.name);
					if (test) {
						[, Name.name, Name.ext] = test;
					} else Name.name = rename.name;
					Name.fullName = Name.name + Name.ext;
					if (rename.removeExt) return Name;
				}
			} else {
				if (rename.preFix) Name.name = rename.preFix + Name.name;
				if (rename.postFix) Name.name += rename.postFix;
			}
		}
		// extension
		const extPat = rename.extPat
			? rename.extPat.replace(/(\.|\*|\$|\\|\/)/g, '\\$1')
			: undefined;
		if ((extPat && new RegExp(extPat).test(name)) || !extPat) {
			if (rename.ext) {
				Name.ext = rename.ext[0] !== '.' ? `.${rename.ext}` : rename.ext;
				Name.fullName = Name.name + Name.ext;
				return Name;
			}
			if (rename.extPre) Name.ext = `${rename.extPre}${Name.ext.replace(/^\./, '')}`;
			if (rename.extPost) Name.ext += rename.extPost;
			if (Name.ext[0] !== '.') Name.ext = `.${Name.ext}`;
		}
		Name.fullName = Name.name + Name.ext;
	}
	return Name;
}

function getCopies(
	files: FolderInfo[],
	to: string,
	options: Options,
	filter: ListObject,
): CopyObject[] {
	const dest = resolve(to);
	const { preserve = PreserveState.root } = options;
	const destArr: string[] = [];
	const result: CopyObject[] = [];
	files.forEach(file => {
		if (file.isFolder) return;
		if (filter.posReg && filter.posReg.test(file.fullName)) {
			const name = getName(file, options);
			const obj: CopyObject = { from: file, to: { name, fullName: '', folder: '' } };
			switch (preserve) {
				case PreserveState.shallow:
					destArr.push(file.parent);
					break;
				case PreserveState.none:
					obj.to.fullName = join(dest, name.fullName);
					obj.to.folder = dest;
					break;
				case PreserveState.deep:
					obj.to.fullName = join(dest, file.fromStart, name.fullName);
					obj.to.folder = join(dest, file.fromStart);
					break;
				default:
					obj.to.fullName = join(dest, file.fromRoot, name.fullName);
					obj.to.folder = join(dest, file.fromRoot);
					break;
			}
			result.push(obj);
		}
	});
	// get shallow
	if (preserve === PreserveState.shallow) {
		let shallowDir = '';
		if (destArr.length > 0) {
			const currentShallow: string[] = destArr[0].split(sep);
			let currentLen = currentShallow.length;
			for (let i = 1, len = destArr.length; i < len; i++) {
				const destSplit = destArr[i].split(sep);
				const minLen = Math.min(destSplit.length, currentLen);
				if (minLen < currentLen) {
					currentShallow.splice(minLen - 1);
					currentLen = minLen;
				}
				for (let x = minLen - 1; x >= 0; x--) {
					// see if we have match
					if (currentShallow[x] !== destSplit[x]) {
						currentShallow.splice(x);
						currentLen = currentShallow.length;
					}
				}
			}
			shallowDir = currentShallow.join(sep);
		}
		const reduceIndex = Math.max(shallowDir.length, 3);
		result.map(copyObj => {
			// eslint-disable-next-line no-param-reassign
			copyObj.to.folder = join(dest, copyObj.from.parent.slice(reduceIndex));
			// eslint-disable-next-line no-param-reassign
			copyObj.to.fullName = join(copyObj.to.folder, copyObj.to.name.fullName);
			return copyObj;
		});
	}

	return result;
}

function renameCopy(fileInfo: CopyObject, options: Options, counter = 1): boolean {
	const { ignoreMax, maxRenameCount = 20 } = options;
	if (!ignoreMax && counter > maxRenameCount) {
		let msg = `maximum iteratoins of ${maxRenameCount} was reached attempting to copy ${fileInfo.from.fullName}.`;
		msg += 'Resolve Options: set maxRenameCount to a higher value, or ignoreMax to true.';
		msg += `The current iterations count is ${counter}.`;
		errorHandler(new Error(msg), options);
		return false;
	}
	const name = `${fileInfo.to.name.name}(${counter})${fileInfo.to.name.ext}`;
	const dest = join(fileInfo.to.folder, name);
	try {
		copyFileSync(fileInfo.from.fullName, dest, constants.COPYFILE_EXCL);
	} catch (error) {
		if (error.code === 'EEXIST') return renameCopy(fileInfo, options, counter + 1);
		/* istanbul ignore next */
		errorHandler(error, options);
	}
	return true;
}

/**
 * See if folder exists, if it does not, create it.
 * @param folderName The name of the folder to ensure exists.
 * @param includeWarnings If true warning messages and errors will be logged to console.
 * @returns {boolean} true if the folder exists else false.
 */
function FolderCheck(folderName, options: Options): boolean {
	if (!existsSync(folderName)) {
		try {
			mkdirSync(folderName, { recursive: true });
		} catch (error) {
			errorHandler(error, options);
			return false;
		}
	}
	return true;
}

function CopyError(error, file: CopyObject, options: Options): boolean | never {
	if (error.code === 'EEXIST' && options.existingFiles === OverWrightEnum.rename) {
		return renameCopy(file, options);
	}
	/* istanbul ignore next */
	if (error.code !== 'EEXIST') throw error;
	else {
		errorHandler(error, options);
		return false;
	}
}

async function copy(copies: CopyObject[], options: Options): Promise<number> {
	const { existingFiles = OverWrightEnum.overwright } = options;
	let counter = 0;
	const prom: Promise<number>[] = [];
	copies.forEach(file => {
		// deal with folders.
		if (!FolderCheck(file.to.folder, options)) return;
		const flag =
			existingFiles !== OverWrightEnum.overwright ? constants.COPYFILE_EXCL : undefined;
		// copy the files
		prom.push(
			new Promise(res => {
				copyFile(file.from.fullName, file.to.fullName, flag, error => {
					if (error) {
						if (!CopyError(error, file, { ...options, existingFiles })) return res(0);
					}
					return res(1);
				});
			}),
		);
	});
	await Promise.all(prom).then(results => {
		results.forEach(cnt => {
			counter += cnt;
		});
	});
	return counter;
}
/**
 * Initiate a copy function based on the options received.
 * @param {CoptyObject[]} copies The files that needs to be coppied.
 * @param {Options} options An options object to pass.
 */
function copySync(copies: CopyObject[], options: Options): number {
	const { existingFiles = OverWrightEnum.overwright } = options;
	let counter = 0;
	copies.forEach(file => {
		// deal with folders.
		/* istanbul ignore next */
		if (!FolderCheck(file.to.folder, options)) return;
		const flag =
			existingFiles !== OverWrightEnum.overwright ? constants.COPYFILE_EXCL : undefined;
		// copy the files
		try {
			copyFileSync(file.from.fullName, file.to.fullName, flag);
		} catch (error) {
			if (!CopyError(error, file, { ...options, existingFiles })) return;
		}

		counter++;
	});
	return counter;
}

export function cpyFlexSync(
	from: string | Array<string>,
	to: string,
	options: Options = {},
): number {
	// build filters
	if (!from || !to) return 0;
	const filters = getFilters(from, options);
	const files: FolderInfo[] = [];
	// get new ignored files
	// get files to copy
	filters.start.forEach(filter => {
		const newOptions: Options = options;
		// get new ignored files
		if (filters.ignore.length > 0) newOptions.ignoreList = filters.ignore;
		if (filters.negReg) newOptions.negReg = filters.negReg;
		filters.positive.forEach(filt => {
			if (filt.startStr.indexOf(filter) === 0) {
				newOptions.root = filt.cwd;
				if (!newOptions.noRecursive) {
					if (!filt.isComplex && !filt.anyFolder && !filt.exact) {
						newOptions.noRecursive = true;
					}
				}
			}
		});
		files.push(...getFoldersSync(filter, newOptions));
	});
	const cpyItems: CopyObject[] = getCopies(files, to, options, filters);
	return copySync(cpyItems, options);
}

export async function cpyFlex(
	from: string | Array<string>,
	to: string,
	options: Options = {},
): Promise<number> {
	// build filters
	if (!from || !to) return 0;
	const filters = getFilters(from, options);
	const files: FolderInfo[] = [];
	const folders: Promise<FolderInfo[]>[] = [];
	// get files to copy
	filters.start.forEach(async filter => {
		const newOptions: Options = options;
		// get new ignored files
		if (filters.ignore.length > 0) newOptions.ignoreList = filters.ignore;
		if (filters.negReg) newOptions.negReg = filters.negReg;
		filters.positive.forEach(filt => {
			if (filt.startStr.indexOf(filter) === 0) {
				newOptions.root = filt.cwd;
				if (!newOptions.noRecursive) {
					if (!filt.isComplex && !filt.anyFolder && !filt.exact) {
						newOptions.noRecursive = true;
					}
				}
			}
		});
		folders.push(getFolders(filter, newOptions));
	});
	const folArr = await Promise.all(folders);
	folArr.forEach(infoArr => files.push(...infoArr));
	const cpyItems: CopyObject[] = getCopies(files, to, options, filters);
	return copy(cpyItems, options);
}

interface CopyObject {
	from: FolderInfo;
	to: {
		folder: string;
		name: NameObject;
		fullName: string;
	};
}
interface NameObject {
	name: string;
	ext: string;
	fullName: string;
}
