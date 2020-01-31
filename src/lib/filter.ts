import { resolve, sep, parse, isAbsolute } from 'path';
import { FolderObject, ListObject, FilterOptions } from './objects';

let dir = '';
let dirRoot = '';
let dirSet = false;
const escSep = `\\${sep}`;

/**
 * Indicate what pattern type the code is => () - curve; {} - curl; [] - square
 */
enum bracketStates {
	none = 0,
	square = 1,
	curl = 2,
	round = 3,
	doubleSquare = 4,
	doubleCurl = 5,
	doubleRound = 6,
}
/**
 * Indicate the state of the pattern type code block
 */
enum codeStates {
	none = 0,
	positive = 1,
	negative = 2,
	question = 3,
	at = 4,
	star = 5,
	dollar = 6,
}
/**
 * Assist in compiling dir properties (the current working directory / base directory)
 * @param {string} newRoot The current working directory to set.
 * @returns {voiid}
 */
function setCwd(newRoot = '.'): void {
	const wrkRoot = newRoot.charAt(0) === '!' ? newRoot.slice(1) : newRoot;
	if (isAbsolute(wrkRoot)) {
		if (wrkRoot[0] !== '/' && wrkRoot[0] !== '\\') dir = wrkRoot.replace(/(\\|\/)+/g, sep);
		else dir = resolve(wrkRoot);
	} else dir = resolve(wrkRoot);
	// add seperator at end for consistency
	if (dir.charAt(dir.length - 1) !== sep) dir += sep;
	dirRoot = parse(dir).root;
	dirSet = true;
}

/**
 * Builds a FolderObject to get a regexp of a folder/file path.
 * @param startFile A relative path to the file/folder that needs a searchString.
 * @param root The current working direcotory to which startFile might be relative to.
 * @param {boolean} [internalCwd] used internally when called by folderFilter.
 * @returns {FolderObject}
 * Prevent unnecessary call to setCwd when already done.
 */
export const filterBuilder = (startFile = '', options: FilterOptions = {}): FolderObject => {
	const { root = process.cwd(), resetRoot = true } = options;
	if (!dirSet || resetRoot) setCwd(root);
	// vars
	// * VARS
	// #region VARS
	/**
	 * The current file value (with or without root)
	 */
	let file = startFile;
	/** The lenght of the file (performance improvement) */
	let fileLen = file.length;
	/** holder of code type values - or pattern */
	const pattern: string[] = [];
	/**
	 * the string valu up to the first pattern string
	 * used to get as close to the correct folder as possible.
	 */
	const folderStrArr: string[] = [];
	/** keep count of open brackets. */
	const bracketCount = {
		'{': 0,
		'(': 0,
		'[': 0,
		arrow: 0,
	};
	/** the main object to be added to folderList */
	const folderObj: FolderObject = {
		file,
		isNegative: false,
		base: dir,
		root: dirRoot,
		isComplex: false,
	};
	/** indicate if we are in hardcode section - i.e. just copy code between <...> */
	let isCode = false;
	// should change with .. or !() or <code>
	/** indicate that the current folderObj has special pattern structure. */
	let hasPattern = false;
	/** how many slashes we have received before the next alphanumeric char */
	let slashCnt = 0;
	/** Indicate that we are in a pattern state */
	let patternState = bracketStates.none;
	/** indicate if the pattern was initialized by +!*@ */
	let codeState = codeStates.none;
	/** a temporary string holder until the next folder */
	let tmpStr = '';
	/** a temporary normal (unescaped) string */
	let tmpNorm = '';
	/** a temporary string holder for code <> */
	let codeStr = '';

	// #endregion VARS

	//* Deconstructing methods
	// #region deconstructing methods
	/**
	 * Indicate that we have got to a / or \
	 * and should start work on next folder or file
	 * @returns {void}
	 */
	function next(done?: boolean): void {
		// this is when / or \ was hit
		if (tmpStr) {
			// FIXME here
			if (!hasPattern) {
				folderStrArr.push(tmpNorm);
				if (done) {
					if (tmpNorm) {
						[, folderObj.fileName, folderObj.ext] = /(\.?.*)(\..*)/.exec(tmpNorm) || [];

						if (!folderObj.fileName && folderObj.ext) {
							folderObj.fileName = folderObj.ext;
							delete folderObj.ext;
						}
					}
					// if (fname) folderObj.fileName = fname;
					// if (ext) folderObj.ext = ext;
				}
			} else if (!done) folderObj.isComplex = true;
			pattern.push(tmpStr);
			tmpStr = '';
			tmpNorm = '';
		}
		slashCnt = 0;
	}

	/**
	 * Adds a character to the correct string.
	 * @param {string} char The character to add.
	 * @param {boolean} mustEscape Whether the character should be escaped.
	 */
	function addChar(char: string, mustEscape?: boolean): void {
		// deal with next
		if (slashCnt) next();
		const c = mustEscape ? `\\${char}` : char;

		// finalize code section
		if (patternState !== bracketStates.none) codeStr += c;
		else {
			if (!hasPattern) tmpNorm += char;
			tmpStr += c;
		}
	}
	/**
	 * The end of a code pattern was hit => ) | ] | }
	 * @returns {void}
	 */
	function endPattern(): void {
		let open = '';
		let close = '';

		switch (patternState) {
			case bracketStates.doubleSquare:
			// break omitted
			case bracketStates.square:
				open = '[';
				close = ']';
				break;
			case bracketStates.curl:
			// break omitted
			case bracketStates.doubleCurl:
			// break omitted
			case bracketStates.doubleRound:
			// break omitted
			case bracketStates.round:
			// break omitted
			default:
				open = '(';
				close = ')';
				break;
		}
		if (codeState === codeStates.negative) {
			if (patternState === bracketStates.round || patternState === bracketStates.curl) {
				open += '?!';
				// const currentfiles = [...pattern];
				// currentfiles.push(open + codeStr + close);
				// folderObj.negatives.push(currentfiles.join(slash));
			} else if (patternState === bracketStates.square) open += '^';
		}
		tmpStr += open + codeStr + close;
		switch (codeState) {
			case codeStates.positive:
				tmpStr += '+';
				break;
			case codeStates.question:
				tmpStr += '?';
				break;
			case codeStates.star:
				tmpStr += '*';
				break;
			default:
				break;
		}
		codeStr = '';
		codeState = codeStates.none;
		patternState = bracketStates.none;
		bracketCount['('] = 0;
		bracketCount['['] = 0;
		bracketCount['['] = 0;
	}

	/**
	 * See if there are multiple bracket openings
	 * @returns {void}
	 */
	function hasBracketCount(): boolean {
		return bracketCount['{'] + bracketCount['('] + bracketCount['['] > 0;
	}

	/**
	 * When a star has been received... resolve by peaking forward
	 * @param {number} ind The index of the current * character
	 * @returns {number} The amount of characters included in the peak.
	 */
	function peakStar(ind: number): number {
		if (slashCnt) next();

		let cnt = 1;
		let slsh = false;
		let stop = false;
		let ext = '';
		let dot = false;
		let starCnt = 1;
		const extLen = 0;
		let dirty = tmpNorm !== '';
		let pat = '*';
		const stars: number[] = [];

		const shouldEnd = (noExt?: boolean): boolean => {
			if (!slsh && !dot && !(noExt && ext) && !dirty) return false;
			stop = true;
			pat = pat.slice(0, -1);
			stars.push(starCnt);
			starCnt = 0;
			return true;
		};
		// getPattern
		while (fileLen > ind + cnt && !stop) {
			const char = file[ind + cnt];
			switch (char) {
				case '/':
				// break omitted
				case '\\':
					if (shouldEnd(true)) continue;
					slsh = true;
					if (!ext) stars.push(starCnt);
					starCnt = 0;
					dot = false;
					break;
				case '.':
					if (shouldEnd()) continue;
					dot = true;
					if (!ext) stars.push(starCnt);
					starCnt = 0;
					slsh = false;
					break;
				case '*':
					if ((starCnt === 1 && extLen > 1) || starCnt === 2) stop = true;
					slsh = false;
					dot = false;
					starCnt++;
					break;
				default:
					if ((!dot && !ext) || slsh) {
						if (!slsh) dirty = true;
						stop = true;
						continue;
					}
					dot = false;
					break;
			}
			if (dot || ext) ext += char;
			cnt++;
		}
		if (starCnt && !ext) stars.push(starCnt);
		// sort out final variables.
		if (slsh || dot) {
			pat = pat.slice(0, -1);
			cnt--;
		}
		const end = cnt + ind === fileLen;
		cnt--;

		// sort out dirty
		if (dirty) {
			const last = stars.pop();
			if (stars.length > 0) {
				if (stars.indexOf(2) === -1) tmpStr += `[^${escSep}]*${escSep}`;
				else tmpStr += `.*${escSep}`;
				tmpNorm = '';
				hasPattern = true;
			}
			// see if it is inside last section
			if (last === 2) addChar('*', true);
			else {
				tmpStr += `[^${escSep}]*`;
				if (last === 3) tmpStr += '\\*';
				tmpNorm = '';
				hasPattern = true;
			}
			return cnt;
		}
		// fix extension variable
		if (!end) {
			// remove ext
			cnt -= ext.length;
			ext = '';
		} else if (ext !== '.*' && ext) {
			let tmpExt = '';
			let strC = 0;
			for (let i = 1, len = ext.length; i < len + 1; i++) {
				const c = i === len ? '' : ext[i];
				if (c === '*') strC++;
				else {
					if (strC === 1) tmpExt += `[^${escSep}]*`;
					else if (strC === 2) tmpExt += '\\*';
					else if (strC === 3) tmpExt += '\\**';
					tmpExt += `${c === '.' ? '\\' : ''}${c}`;
					strC = 0;
				}
			}
			ext = tmpExt;
		}

		let double = false;
		let single = false;
		let triple = false;
		for (let i = stars.length - 1; i >= 0; i--) {
			if (stars[i] === 1) single = true;
			else if (stars[i] === 3) triple = true;
			else {
				double = true;
				i = 0;
			}
		}

		let result = '';

		if (double) {
			result = '.*';
			if (end) folderObj.anyFolder = true;

			if (single && end) folderObj.anyFile = true;
		} else if (single) {
			result = `[^${escSep}]*`;
			if (end) folderObj.anyFile = true;
		}
		if (triple) {
			if (result !== '') result += `${escSep}`;
			result += '\\**';
		}

		if (ext === '.*' || (!ext && !folderObj.anyFolder)) folderObj.anyExtension = true;
		else if (end && ext) folderObj.ext = `.${ext}`;

		if (result) {
			if (ext) result += ext !== '.*' ? `\\.${ext}` : '';
			tmpStr += result;
			hasPattern = true;
			tmpNorm = '';
		}

		return cnt;
	}

	/**
	 * See if the following character is a bracket type
	 * @param {number} ind The index of the current character (+!@*$)
	 * @returns {boolean} true if the next character is type of bracket
	 */
	function peakBracket(ind: number): boolean {
		if (fileLen === ind + 1) return false;
		const char = file[ind + 1];
		if (char === '(' || char === '{' || char === '[') {
			hasPattern = true;
			return true;
		}
		return false;
	}

	/**
	 * Open a patern type
	 * @param ind The current index of of the brk variable.
	 * @param brk The current brk value.
	 * @param brkState The bracketState(enum value).
	 * @returns {number} the amount the index need to move forward with.
	 */
	function openBrkReceived(ind: number, brk: string, brkState: bracketStates): number {
		if (slashCnt) next();
		if (patternState) {
			bracketCount[brk]++;
			addChar(brk);
		} else if (codeState) patternState = brkState;
		else if (peakBracket(ind)) {
			if (file[ind + 1] === brk) {
				patternState = brkState + 3;
				bracketCount[brk]++;
				return 1;
			}
			addChar(brk, true);
		} else addChar(brk, true);
		return 0;
	}

	/**
	 * Close a patern type open bracket.
	 * @param brk The current bracket character
	 * @param openBrk The opening bracket that compliment the brk variable.
	 * @param brkState The current bracketState (enum variable).
	 * @returns {boolean} true if a double bracket was found (()). [if true index++]
	 */
	function closeBrkReceived(brk: string, openBrk: string, brkState: bracketStates): boolean {
		if (hasBracketCount()) {
			if (patternState === brkState + 3 && bracketCount[openBrk] === 1) {
				endPattern();
				return true;
			}
			bracketCount[openBrk]--;
			addChar(brk);
		} else if (patternState) endPattern();
		else addChar(brk, true);
		return false;
	}
	/**
	 * see if we should escape a character by peaking at next character.
	 * @param {number} ind The index of the current character "\"
	 * @returns {boolean} true if next character has been escaped.
	 */
	function peakEscape(ind: number): boolean {
		if (fileLen === ind + 1) return false;
		const char = file[ind + 1];
		if (char === '.' || char === '?' || char === '*' || char === '+' || char === '$') {
			// \. \? \* => literal dot, question, star
			if (slashCnt) next();
			addChar(char, true);
			return true;
		}
		if (char === '!') {
			addChar(char);
			return true;
		}
		if (char === '\\') return true;
		return false;
	}
	/**
	 * Take a string and build a regular expression string
	 * @returns {FolderObject}
	 */
	function deconstructFile(): void {
		// Iterate through the file variable.
		for (let i = 0; i < fileLen; i++) {
			if (isCode) {
				if (file[i] === '>') {
					if (bracketCount.arrow === 0) {
						tmpStr += codeStr;
						codeStr = '';
						isCode = false;
						hasPattern = true;
					} else codeStr += '>';
					bracketCount.arrow--;
				} else {
					if (file[i] === '<') bracketCount.arrow++;
					codeStr += file[i];
				}
				continue;
			}
			let cnt = 0;
			switch (file[i]) {
				case '<':
					// not allowed to have < in folder structure...
					// Could be part of pattern -> must then be escaped? [check escape]
					// everything from this point will be considered regex
					if (slashCnt) next();
					isCode = true;
					break;
				case '\\':
					if (patternState) {
						// just add and continue - rely on user for correct escaping.
						addChar('\\', true);
						break;
					} else if (peakEscape(i)) {
						if (file[i + 1] === '\\' || file[i + 1] === '/') slashCnt++;
						i++;
						break;
					}
				// break omitted
				case '/':
					if (patternState) {
						// just add and continue - rely on user for correct escaping.
						addChar('/');
						break;
					}
					// slash will be the reset point
					slashCnt++;
					break;
				case '[':
					i += openBrkReceived(i, '[', bracketStates.square);
					break;
				case '{':
					i += openBrkReceived(i, '{', bracketStates.curl);
					break;
				case '(':
					i += openBrkReceived(i, '(', bracketStates.round);
					break;
				case ']':
					if (closeBrkReceived(']', '[', bracketStates.square)) i++;
					break;
				case '}':
					if (closeBrkReceived('}', '{', bracketStates.curl)) i++;
					break;
				case ')':
					if (closeBrkReceived(')', '(', bracketStates.round)) i++;
					break;
				case '!':
					if (slashCnt) next();
					if (patternState) addChar('!');
					// see if patternState starts
					else if (peakBracket(i)) codeState = codeStates.negative;
					else addChar('!');
					break;
				case '$':
					if (slashCnt) next();
					if (patternState) addChar('$');
					// see if patternState starts
					else if (peakBracket(i)) codeState = codeStates.dollar;
					else if (i === fileLen - 1) {
						// just add to tmpStr... not to tmpNorm.
						tmpStr += '$';
					} else addChar('$', true);
					break;
				case '+':
					if (slashCnt) next();
					// Pattern state is reliant on user input
					if (patternState) addChar('+');
					// this is literal +
					else if (peakBracket(i)) codeState = codeStates.positive;
					else if (i + 1 < fileLen && file[i + 1] === '+' && tmpStr) {
						// ++ => regex +
						hasPattern = true;
						addChar('+');
						if (i + 2 < fileLen && file[i + 2] === '+') {
							if (peakBracket(i + 2)) codeState = codeStates.positive;
							else addChar('+', true);
							i++;
						}
						i++;
					} else addChar('+', true);
					break;
				case '?':
					if (slashCnt) next();
					if (patternState) addChar('?');
					// this is literal ?
					else if (peakBracket(i)) codeState = codeStates.question;
					else if (i < fileLen && file[i + 1] === '?' && tmpStr) {
						hasPattern = true;
						addChar('?');
						if (i + 2 < fileLen && file[i + 2] === '?') {
							addChar('?', true);
							i++;
						}
						i++;
					} else addChar('?', true);
					break;
				case '@':
					if (slashCnt) next();
					if (patternState) addChar('@');
					// this is literal ?
					else if (peakBracket(i)) codeState = codeStates.at;
					else addChar('@');
					break;
				case '*':
					// sort out with peakStar
					if (patternState) addChar('*');
					else if (peakBracket(i)) codeState = codeStates.star;
					else i += peakStar(i);
					break;
				case '.':
					if (slashCnt) next();
					if (patternState) {
						addChar('.');
						break;
					}
					// get the number of dots
					// eslint-disable-next-line no-case-declarations
					cnt = 1;
					while (i + cnt < fileLen && file[i + cnt] === '.') cnt++;
					i += cnt - 1;

					if (cnt === 2 && patternState === bracketStates.none) {
						// remove a folder or regex .
						if (
							(fileLen > i + 1 && file[i + 1] !== '\\' && file[i + 1] !== '/') ||
							tmpStr
						) {
							// . in regex
							hasPattern = true;
							addChar('.');
						} else if (pattern.length > 0) {
							pattern.pop();
							if (pattern.length < folderStrArr.length) folderStrArr.pop();
						} else if (folderObj.base) {
							// remove from cwd
							const cwdArr = folderObj.base.split(sep);
							// remove empty
							if (cwdArr[cwdArr.length - 1] === '') cwdArr.pop();
							// don't remove root
							if (cwdArr.pop() + sep !== folderObj.root) {
								folderObj.base = cwdArr.join(sep) + sep;
							}
						}
					} else for (let x = 0; x < cnt; x++) addChar('.', true);
					break;
				default:
					addChar(file[i]);
					break;
			}
		}
		if (tmpStr || codeStr) next(true);
	}
	// #endregion deconstructing

	//* Rebuild methods
	// #region rebuild file
	function reconstructFile(): void {
		/* istanbul ignore next */
		if (folderObj.root && !folderObj.base) folderObj.base = folderObj.root;
		// work through pattern
		const sanCwd = folderObj.base.replace(new RegExp(`${escSep}`, 'g'), `${escSep}`);
		if (folderStrArr.length > 0) {
			folderObj.startStr = `${folderObj.base}${folderStrArr.join(sep)}`;
		} else folderObj.startStr = folderObj.base;
		if (pattern.length > 0) {
			folderObj.searchStr = `${sanCwd}${pattern.join(escSep)}`;
		} else folderObj.searchStr = sanCwd;
		if (!folderObj.anyFile && !folderObj.fileName) folderObj.anyFile = true;
		if (!folderObj.anyExtension && !folderObj.ext) folderObj.anyExtension = true;
		// sort out last entry
		if (!hasPattern && (!folderObj.ext || folderObj.ext === '.')) {
			if (folderObj.searchStr[folderObj.searchStr.length - 1] === sep) {
				folderObj.searchStr = folderObj.searchStr.replace(/(\\|\/)+$/, '');
			}
			folderObj.searchStr += `(${escSep}.+)?$`;
		}

		let strtFile = folderObj.file.replace(/(\/|\\)/g, sep);
		strtFile = folderObj.base + strtFile.replace(/^!?\.?(\/|\\)/, '');
		if (strtFile === folderObj.startStr) folderObj.exact = true;
		folderObj.reg = new RegExp(folderObj.searchStr);
	}

	// #endregion rebuild

	/**
	 * Initialize and start of the work.
	 */
	function init(): FolderObject {
		// confirm start
		let [char] = file;
		if (char === '!') {
			file = file.slice(1);
			folderObj.isNegative = true;
			[char] = file;
		}
		if (isAbsolute(file)) {
			if (char === '/' || char === '\\') {
				folderObj.root = dirRoot;
				file = file.slice(1);
			} else {
				const parsed = parse(file);
				folderObj.root = parsed.root.replace(/(\\|\/)+/, sep);
				file = file.slice(parsed.root.length);
			}
			folderObj.base = folderObj.root;
		} else if (char === '.' && (file[1] === '\\' || file[1] === '/')) {
			file = file.slice(2);
		}
		fileLen = file.length;
		deconstructFile();
		reconstructFile();
		return folderObj;
	}

	return init();
};
/**
 * See how 2 objects compare with each other and return:
 * 0 if both items should be kept (they are both unique)
 * -1 if obj1 should be kept (it is superior and will catch all of obj2)
 * 1 if obj2 should be kept (obj2 is superior and will catch all of obj1).
 */
function isUnique(obj1: FolderObject, obj2: FolderObject, isFinal?: boolean): number {
	if (obj1.isComplex || obj2.isComplex) return 0;
	let match = new RegExp(`([^${escSep}]*)?(\\.[^${escSep}]*)`).exec(obj2.startStr);
	let name = '';
	let ext = '';
	if (match) {
		[, name, ext] = match;
	}
	/* istanbul ignore next */
	name = name ? '' : obj2.fileName ? sep + obj2.fileName : `${sep}tst`;
	ext = ext ? '' : obj2.ext ? obj2.ext : '.js';
	name = name.replace(/\.\*/g, 'a');
	ext = ext.replace(/\.\*/g, 'a');
	// const fol = obj1.anyFolder ||
	const fullName = obj2.startStr + name + ext;
	match = obj1.reg.exec(fullName);
	if (match && match[0] === fullName) {
		if (obj1.anyFolder && obj1.anyFile && obj1.anyExtension) return -1;
		/* istanbul ignore next */
		if (
			(obj1.anyFolder && (obj2.anyFolder || obj1.anyFolder)) ||
			obj2.startStr.indexOf(obj1.startStr) > -1
		) {
			// we can continue to second test
			/* istanbul ignore next */
			if (
				(obj1.anyFile && obj2.anyFile) ||
				obj1.fileName === obj2.fileName ||
				(obj1.fileName && new RegExp(obj1.fileName).test(obj2.fileName)) ||
				!obj2.anyFile
			) {
				// we can continue to third test
				/* istanbul ignore next */
				if (
					(obj1.anyExtension && obj2.anyExtension) ||
					obj1.ext === obj2.ext ||
					(obj1.ext && new RegExp(obj1.ext).test(obj2.ext)) ||
					!obj2.anyExtension
				) {
					return -1;
				}
			}
		}
	}
	// else test the reverse
	if (!isFinal) return isUnique(obj2, obj1, true) * -1;
	return 0;
}
/**
 * Create a list of filtered items that could be used to search a specific folder pattern.
 * @param {string|string[]} folders A list of relative folder paths to create searchpatterns for.
 * (glob pattern + regex)
 * @param {FilterOptions} options Additional options to use while filtering;
 * @returns {ListObject}
 */
export function getFilters(folders: string | string[], options: FilterOptions = {}): ListObject {
	const folderArr: string[] = typeof folders === 'string' ? [folders] : folders;
	const { root = process.cwd(), unique = true, resetRoot = true } = options;

	const foldersList: ListObject = {
		positive: [],
		negative: [],
		posString: '',
		start: [],
		negString: '',
		ignore: [],
	};

	if (!folders || folders.length === 0) return foldersList;
	// set dir
	if (resetRoot) setCwd(root);

	folderArr.forEach(folder => {
		const searchObj = filterBuilder(folder, { root, resetRoot: false });

		// confirm if this is unique
		if (searchObj.isNegative) {
			if (unique) {
				for (let i = foldersList.negative.length - 1; i >= 0; i--) {
					if (searchObj.reg.test(foldersList.negative[i].startStr)) {
						foldersList.negative.splice(i, 1);
					} else if (foldersList.negative[i].reg.test(searchObj.startStr)) return;
				}
			}
			foldersList.negative.push(searchObj);
		} else {
			if (unique) {
				for (let i = foldersList.positive.length - 1; i >= 0; i--) {
					const uniqueTest = isUnique(searchObj, foldersList.positive[i]);
					if (uniqueTest === 0) continue;
					if (uniqueTest === -1) foldersList.positive.splice(i, 1);
					else return;
				}
			}
			foldersList.positive.push(searchObj);
		}
	});

	foldersList.negative.forEach(neg => {
		if (foldersList.negString) foldersList.negString += '|';
		foldersList.negString += neg.searchStr;
		if (neg.exact || neg.anyFolder) foldersList.ignore.push(neg.startStr);
	});
	foldersList.positive = foldersList.positive.filter(pos => {
		for (let i = 0, len = foldersList.ignore.length; i < len; i++) {
			if (pos.startStr.indexOf(foldersList.ignore[i]) === 0) return false;
		}
		return true;
	});
	foldersList.positive.forEach(pos => {
		if (foldersList.posString) foldersList.posString += '|';
		foldersList.posString += pos.searchStr;
		foldersList.start.push(pos.startStr);
	});
	if (foldersList.posString) foldersList.posReg = new RegExp(foldersList.posString);
	if (foldersList.negString) foldersList.negReg = new RegExp(foldersList.negString);
	foldersList.start = foldersList.start.filter((val, idx, self) => self.indexOf(val) === idx);
	return foldersList;
}
