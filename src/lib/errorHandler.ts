import { ErrorOptions, ErrorHandleObject } from './objects';

export function errorHandler(
	error: Error,
	{ errorHandle = ErrorOptions.none }: ErrorHandleObject,
): void | never {
	if (errorHandle === ErrorOptions.throwError) throw error;
	else if (errorHandle === ErrorOptions.log) console.warn(error);
}
