export function cli(args): void {
	console.log(args);
	const obj = {
		string: String,
		bool: Boolean,
		arrString: [String],
	};
	console.log(obj);
	// eslint-disable-next-line no-restricted-syntax
	console.log(Array.isArray(obj.string));
}
