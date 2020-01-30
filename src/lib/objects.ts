import { Dirent } from 'fs';

export interface FolderObject {
	/** The original file string received. (unsanitized) */
	file?: string;
	/** Regular expression of the file string */
	reg?: RegExp;
	/** The start string before any star (sanitized) */
	startStr?: string;
	/** the root folder */
	root?: string;
	/** the current working directory (unsanitized) */
	cwd?: string;
	/** Indicate that the current string should be disallowed completely */
	isNegative: boolean;
	/** the full sanitized search string not (sanitized) */
	searchStr?: string;
	/** indicate that search string ends with all folders */
	anyFolder?: boolean;
	/** indicate that search string ends with all files in folders */
	anyFile?: boolean;
	/** indicate that search string ends with any extension type */
	anyExtension?: boolean;
	/** An extension limiter at end of the string */
	ext?: string;
	/** A file name for the file */
	fileName?: string;
	/** the last item in the search string.  Could be file or folder */
	last?: string;
	/** Indicate that there are no regex in string (startStr ~> file) */
	exact?: boolean;
	/** there could be multiple regex queries in the string if true. */
	isComplex: boolean;
}
export interface ListObject {
	negative: FolderObject[];
	positive: FolderObject[];
	negString: string;
	negReg?: RegExp;
	posString: string;
	posReg?: RegExp;
	start: string[];
	ignore: string[];
}
/**
 * Options that could be used with folderFilter.
 */
export interface FilterOptions {
	/**
	 * Return all results if false, else return a filtered list with most relevant info.
	 * Default = true.
	 */
	unique?: boolean;
	/**
	 * If set all the folders in the list will be relative to this path.
	 * Default = current working directory (process.cwd());
	 */
	root?: string;
	/**
	 * Used by filters Function and indicate whether root should change from previous run if
	 */
	resetRoot?: boolean;
}
export interface ErrorHandleObject {
	errorHandle?: ErrorOptions;
}

export interface FolderBuilderOptions extends ErrorHandleObject {
	/**
	 * An optional root directory which should be used instead of cwd.
	 * @default process.cwd()
	 */
	root?: string;
	/**
	 * If true, it is assumed that the value pased to startStr is absolute (C:/.....),
	 * Else the start value will be concatenated with root property (or cwd if no root property);
	 * @default false;
	 */
	noStartFix?: boolean;
	/**
	 * An optional folders to not include in the return list.
	 */
	ignoreList?: string[];
	/** A string representation of a regexp that indicate if file/folder should be ignored */
	negString?: string;
	/** A regexp test to see if file / folder should be ignored. */
	negReg?: RegExp;
	/**
	 * If true, it is assumed that the values of ignore is absolute (C:/.....),
	 * Else these values will be concatenated with root property (or cwd if no root property).
	 * @default false
	 */
	noIgnoreFix?: boolean;
	/**
	 * If true, only return current folder structure, else will recurse folders from startStr.
	 * @default false
	 */
	noRecursive?: boolean;
}

export interface FolderInfo {
	fullName?: string;
	name: string;
	info: Dirent;
	isFolder: boolean;
	ext: string;
	longExt: string;
	longName: string;
	shortName: string;
	parent: string;
	ignoreFolder?: boolean;
	fromRoot?: string;
	fromStart?: string;
}

export interface Options extends FilterOptions, FolderBuilderOptions, ErrorHandleObject {
	/**
	 * Indidate if any of the current folder paths should be preserved when copying
	 * @default PreserveState.shallow
	 */
	preserve?: PreserveState;
	rename?: RenameOptions;
	/**
	 * If set to true the maxRenammeCount is set to infinite.
	 * Else the maxRenameCount will be used.
	 * It is not advised to set to true.
	 */
	ignoreMax?: boolean;
	/**
	 * The maximum amount of attempts to rename a file.
	 * @default 20;
	 */
	maxRenameCount?: number;
	/**
	 * If true the file will not overwrite an existing file when being copied.
	 */
	existingFiles?: OverWrightEnum;
	longExtension?: boolean;
}

export enum PreserveState {
	/** No folder structure is preserved.  Files are outputed directly to the output folder." */
	none,
	/**
	 * A shallow folder structure is preserved if multiple files are specified.
	 * E.g. if files to copy from = [a/b/a/indx.js, a/b/b/indx.js] and
	 * output folder is \"to\" files is copied as [to/a/indx.js, to/b/inds.js].
	 * a/b - is common between them and will be removed. */
	shallow,
	/**
	 * A deep folder structure is preserved if multiple files are specified.
	 * The start point of files is the folder provided.
	 * Only valid if star folders are used a/** wil mean that structure wil start from
	 * {cwd}/a
	 */
	deep,
	/**
	 * Use the root as default starting point to start preserving folder structure.
	 */
	root,
}

export interface RenameOptions {
	/** The name of the file. */
	name?: string;
	/**
	 * If true the name and extension will be replaced with the name property.
	 * else the extension will remain the same and only the name will be replaced.
	 */
	removeExt?: boolean;
	/** Only change name that fits pattern if set, else all names will change */
	namePat?: string;
	/** A new extension to add to the file name. */
	ext?: string;
	/** only change if pattern match.  If not set all extensions will change. */
	extPat?: string;
	/** An optional value to add to the start of the file name. */
	preFix?: string;
	/** An optional value to add to the end of the file name. */
	postFix?: string;
	/** A value to prefix the extension name with. */
	extPre?: string;
	/** A value to add to the end of the extension. */
	extPost?: string;
}

export enum OverWrightEnum {
	overwright,
	rename,
	dontCopy,
}
export enum ErrorOptions {
	/** Do not log any errors and gracefully continue. */
	none,
	/** only lob the errors to the console. */
	log,
	/** throw the errors. */
	throwError,
}
