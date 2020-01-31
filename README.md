# CPY-FLEX

![travis](https://travis-ci.com/DaClan008/cpy-flex.svg?branch=master)
[![codecov](https://codecov.io/gh/DaClan008/cpy-flex/branch/master/graph/badge.svg)](https://codecov.io/gh/DaClan008/cpy-flex)
[![Coverage Status](https://coveralls.io/repos/github/DaClan008/cpy-flex/badge.svg?branch=master)](https://coveralls.io/github/DaClan008/cpy-flex?branch=master)
![npm](https://img.shields.io/npm/v/cpy-flex)
![download](https://img.shields.io/npm/dw/cpy-flex)
![NPM](https://img.shields.io/npm/l/cpy-flex)

A flexible copy module that extend the normal glob pattern to include regex searches.

## Install

```console
npm install cpy-flex
```

## Usage

```js
const { cpyFlexSync, cpyFlex } = require('cpy-flex');

const fromArr = ['./a/b.js', '**/c/d.js', '*(a|c)/d.js'];

const toFolder = './bin';
const options = {};

const opied = cpyFlexSync(fromArr, toFolder, options);
console.log(copied); // prints the total copies made.

// OR ASYNC...

cpyFlex(cfomrArr, toFolder, options).then(copied => console.log(copied));
```

### Params

| Param  | Input Type                | Description                                                     |
| ------ | ------------------------- | --------------------------------------------------------------- |
| from   | string \| Array\<string\> | Can be any allowable pattern. See also [patterns](./#patterns). |
| to     | string                    | Can be a normal glob pattern string.                            |
| option | options                   | A options object also see [Options](./#options)                 |

## Options

The following options can be used. The groups are merely for ease of reading.

### General Options

| Property       | PropertyType                                | Description                                                                                                                                                                                                                                                                         |
| -------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| preserve       | [enum\<PreserveState\>](./#preservestate)   | Indicate what the output structure should look like.                                                                                                                                                                                                                                |
| rename         | [RenameOptions](./#renameoptions)           | An object to use if the file names and or extension should be changed.                                                                                                                                                                                                              |
| maxRenameCount | number                                      | Is used when the file being copied already esists and existingFiles is set to 'rename'. This sets the maximum number to use in the rename.                                                                                                                                          |
| ignoreMax      | boolean                                     | If set to true, the maxRenameCount is theoretically set to infinite. _Default=false_                                                                                                                                                                                                |
| existingFiles  | [enum\<OverwrightEnum\>](./#overwrightenum) | Is used when the file being copied already exist in the output directory. _Default=overwright_                                                                                                                                                                                      |
| longExtension  | boolean                                     | If true indicates to the system that file names will not have . values, and if a filename has multiple . values, all of them is considered to be the extension name (extension for file.some.js will be .some.js). Else if set to false the extension for file.some.js will be .js. |
| root           | string                                      | The root directory to work from. If set and all relative from values will resolve to this directory. _Default=Current Working Directory_                                                                                                                                            |

### Filter Options

The following set of values relate to Filtering or parsing through the "from" string (i.e. what to get):

| Property      | Type    | Description                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| unique        | boolean | If true the filter will attempt to exclude getting folders which has already been found. This is preferred if a lot of files is being copied as it will not search through folders and subfolders of every string provided. However if there is only two files (with shallow folder structures) being provided, this could be set to false as it then bypass filtering process. _Default=true_ |
| \*_resetRoot_ | boolean | Only used if the **filterBuilder** is used (i.e. not cpyFileSync / cpyFile) inside **lib/filter**. If true will reset the root variable which is a global variable inside lib/filter. This is always true if cpyFile is used.                                                                                                                                                                  |

### Folder Builder Options

The following set of values relating to gathering the current directory and file structure (i.e. the current available options):

| Property    | Type    | Description                                                                                                                                                                                                       |
| ----------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| noStartFix  | boolean | If true, the files provided will not be parsed internally. i.e. ./folder will not be parsed to C:...\\folder. If the fs function is unable to execute against this value, an error may be thrown. _Default=false_ |
| noRecursive | boolean | Will ensure that folders being returned is limited to files within a specific folder and not files inside subfolders if set to true, else will also return files inside subfolders. _Default=false_               |

The following should only be set if **getFoldersSync** or **getFolders** function is used and may be overwritten by cpyFlex or cpyFlexSync:

| Property    | Type            | Description                                                                                                                                                                                                                       |
| ----------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ignoreList  | Array\<string\> | An optional list of folders to ignore when returning a set of files/directories.                                                                                                                                                  |
| negString   | string          | a string representation of a regex Expression (must be properly escaped as it will not be rechecked). If set the file being found will be tested against this string. if it is a match the file will be ignored and not returned. |
| negReg      | RegExp          | This is the result of negString. If both negString and negReg is set negReg may be overwritten.                                                                                                                                   |
| noIgnoreFix | boolean         | if set to true, no attempt will be made to fix folder destinations provided for here. (similar to noStartFix, but for the ignoreList).                                                                                            |

## Option Objects

#### PreserveState

An enum to indicate what the file structure should look like when it is copied to output directory. The options are:

| Nr. | value   | Description                                                                                                                                                                                                                                                                                                                                                 |
| --- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | none    | files: a/folder1/file1.js, a/folder1/file2.js will be coppied as follows: bin/file1.js, bin/file2.js (if bin is the output directory). It therefore ignores the directory structure and only copy the files. This might overwright previous written files with same names.                                                                                  |
| 1   | shallow | A shallow directory structure means that the first common directory between multiple files are sought, and the directory structure is presered from this state forward. Might have the same output as shallow, depending on the locatioon of the files begin found. If there is only one file, this file should be outputed directly in the from directory. |
| 2   | deep    | The structure is preserved from the directory that is provided. For instance if you have a directory structure preA->a->b->file1 and preA->a->c->file2 and provide a 'from value' as preA/a/\*\*/\*.\* the structure that will be preserved is from (a). This becomes applicable if 'from' value is an array.                                               |
| 3   | root    | It uses the root as the starting point to start building it's tree. Therefore in the above example the structure will build from preA if preA.                                                                                                                                                                                                              |

#### usage

```js
const { PreserveState } = require('cpy-flex').objects;

const options = {
	preserve: PreserveState.none,
};

cpyFlexSync('./folder/file.js', './bin', options);
// file will be output: bin/file.js
```

#### RenameOptions

This is an object that allows for renaming of a file and extension name. The following is a set of available properties relating to the fileName:

| Property  | Type    | Description                                                                                                                                                                                                                                                                                   |
| --------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| name      | string  | The value of the new name that should be used (this could potentially include a extension value).                                                                                                                                                                                             |
| removeExt | boolean | if set to true, the current extension value will be removed when copied.                                                                                                                                                                                                                      |
| namePat   | string  | A string representation of a regex expression. If set and a fileName of a current file matches this pattern the name will be changed (full fileName is used ~> file.ext, and exclude path) This string should be properly escaped as it will be passed directly to RexExp without validation. |
| preFix    | string  | The prefix value will prefix the file name. i.e. if preFix is 'pre' the output will be 'prefile.js' if the file name is file.js.                                                                                                                                                              |
| postFix   | string  | The postfix value will add the value set to the end of the file name. i.e. if postFix is 'post' the ouput file name will be filepost.js if file.js is the file name.                                                                                                                          |

The following is a set of available property options for changing the extension value (please also refer to 'longExtension' option that can be set):

| Property | Type   | Description                                                                                                                                                                        |
| -------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ext      | string | if set the extension value will be changed to the value set here.                                                                                                                  |
| extPat   | string | A string representation of a regex expression. If the current file name match the expression the extension will be changed. The full name is used to test against (i.e. file.ext). |
| extPre   | string | Is a prefix value to add in front of the extension value. If value is set to 'lib' the output name will be (file.libjs) if the file name is 'file.js'.                             |
| extPost  | string | Is a value to add at the end of the extension value. If value is set to '.maps' the output file will be 'file.js.maps' if the file name is 'file.js'.                              |

> Please note if removeExt is used all extension values above is ignored.

#### usage

```js
const options = {
    rename: {
        preFix: 'changed-',
        extPre: '.done.',
        namePat: '\\.js',
        extPat: 'ile.p',
    }
};

const from = 'file.pdf'
const result = cpyFlexSync(from, './bin', options);)
// output bill be file.done.pdf
```

### OverWrightEnum

This is an enum to assist with duplicate file names being written. The available options are as follows:

| Nr  | Value      | Description                                                                                                                                          |
| --- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | overwright | This will overwright any files that already exist. This is the default behaviour.                                                                    |
| 1   | rename     | This will attempt to rename the file name being coppied by postfixing (number) to the end. **_also refer to ignoreMax and maxRenameCount options_**. |
| 2   | throwError | Will throw an error when attempting to overwright an existing file.                                                                                  |

## Patterns

The following is a set of general rules when referencing folders:

-   **!./some folder** -> will be included in "ignoreList" when cpyFlex(Sync) is used.
-   **/some folder** -> will resolve to rootDir. i.e. C:/some.
-   **C:/...** -> will not be alterered and will be accepted as absolute path.
-   **./some Folder** -> will resolve to root or current working directory.
-   **some Folder** -> will resolve to root or current working directory.

### Pure Regex

There are 2 main ways to add regex queries to a query string:

-   The first is a hard Regex string approach with the use of <..REGEX..>. Whatever is placed between < and > will be used as is in regex query without attempting some filtering. i.e. code should be escaped and will not be escaped by the function.
-   The Second is the use of other brackets which should be preceded by a iterator character (i.e. +(...REGEX...)). Any bracket pair could be used with any iterator character. The regex between these strings will be escaped by the function. Some escaping might occur within this REGEX string.

Potential brackets is the following: { ... } or ( ... ) or [ ... ]

The following is possible iterator characters:

-   **+** -> regex must have between one and many occurences -> +(REGEX) => (REGEX)+
-   **\*** -> regex must have between zero and many occurences -> \*(REGEX) => (REGEX)\*
-   **@** -> regex will occur exactly once -> @{REGEX} => (REGEX)
-   **\$** -> is the same as using @ -> \${REGEX} => (REGEX)
-   **?** -> regex may occur once or not at all -> ?(REGEX) => (REGEX)?
-   **!** -> will result in:
    -   Negative lokahead (?!=REGEX) if used with (..) or {..}
    -   Exclusion pattern [^regex] if used with [..]

Square brackets will always remain square brackets: [REGEX] ~> [REGEX]
Round brackets and Curly brackets will always be round brackets: {REGEX} ~> (REGEX)

e.g.

```js
const fromA = 'folder+{up}/file<d*>.js?(x)';
// will result in regex string as follows:
const regA = /folder(up)+\\file\d.js(x)?/;
```

This example should return:

-   a file with a name which is followed by a number.
-   an extension wich is either js or jsx.
-   inside a directory of: folderup or folderupup or folderupupup etc.

and

```js
const fromB = 'fo?[le]d![e]r.js
// will result in regex string as follows:
const regB = 'fo[le]?d[^e]r.js
```

the example should:

-   return any file with name of foldar or foedbr.
-   but will not return folder as a possible name (folder will be excluded)

### DOT (.)

The following is a set of general rules using dot in files:

-   **./Some Folder** -> will resolve to root or current working directory.
-   **../Some/folder/../file.js** -> will resolve to C:\Some\file.js if root is C:\src as example. (remove previous directory path).
-   **some..folder** or **somefolder../** or **..somefolder/** -> Will be considered a regex dot (i.e. any character).
-   **some.folder** -> is considered an ordinary dot and will be escaped in search string / regex objects.

### STAR (\*)

The use of wildcard \* character should be the same with current glob patterns with the extension of the following rules:

-   double star:

    -   within a folder structure will mean any sub directory. i.e. a/** will result in all files in 'a' directory and its subfolders will be copied. ** will result in all files inside root folder and it's subfolders will be copied.
    -   if there are any othercharacter before or after double star (i.e. a\*\*/ or a\*\*b) will result in a REGEX star being used in the folder structure. Therefore a\*\*b will mean return results for folder ab or aab or aaaab etc.
    -   However if double star is the first character in a directory structure it will always be a literal \* (i.e. escaped \*). i.e. a/\*\*b/c will result in a\\\\\\\*b\\c to be outputted (\* can never be the first charcter in regexp, so it is assumed a literal \* should be added)
    -   The rule above is changed on the **file name or ext**. Double star in this place will mean an escaped _ as the usual glob pattern is that single star's in file name or ext is any file pattern. Therefore inside file name or ext (the last path part) double star will result in escaped star (\\_) to be used in regex string.

-   single star:

    -   within folder structure will be a normal star (i.e. should a folder name include a \* character, this could be used normally).
    -   In the last variable in the structure (**file name or ext**) a star means any string pattern can be followed (i.e. a/\*.\*) will result in any file name and any extension to be returned.

-   Before brackets:

    -   As explained before a star character infront of a ( .. ) or { ... } will result in regex string to include ( ... )\*
    -   A single star character infront of a [ ... ] will result in regex string to include [ ... ]\*
    -   A single or double star infront of < ... > will have the same meaning as if < ... > was never there.

## Contributions

Contributions are welcome. I hope you enjoy, and feel free to contact me for any advice, enhancement.

## Change Log

**0.0.4**

-   Fixed spelling error
-   Just for testing (nothing in the code has changed much).

**0.0.3**

-   Fixed execution of code in linux based systems.
-   Fixed tests to run on linux system.
-   Adding readme and keywords inside Package.json.
