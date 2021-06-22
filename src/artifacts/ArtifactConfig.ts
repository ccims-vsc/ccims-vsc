export class ArtifactConfig {
	private readonly _artifactMatcher: RegExp;

	private readonly _urlToPathTransformer: RegexList;

	private readonly _pathToUrlTransformer: RegexList;

	private readonly _pathToUrlFilterTransformer: RegexList;

	private readonly _postprocesses: { pattern: string, replace: string }[];

	public constructor(config: ArtifactSchema, url: string) {
		const nameRegexList = new RegexList(config.componentName);
		const componentName = nameRegexList.transformString(url);
		this._artifactMatcher = new RegExp(config.matchesArtifactUrl.replaceAll("${name}", componentName));
		this._urlToPathTransformer = new RegexList(config.urlToPath);
		this._pathToUrlTransformer = new RegexList(config.pathToUrl);
		this._pathToUrlFilterTransformer = new RegexList(config.pathToUrlFilter);
		this._postprocesses = [
			{
				pattern: "${name}",
				replace: componentName
			}
		];
	}

	public matchesArtifactUrl(artifactUrl: string): boolean {
		return this._artifactMatcher.test(artifactUrl);
	}

	public urlToPath(url: string): string {
		return this._urlToPathTransformer.transformString(url, this._postprocesses);
	}

	public pathToUrl(path: string): string {
		return this._pathToUrlTransformer.transformString(path, this._postprocesses);
	}

	public pathToUrlFilter(path: string): string {
		return this._pathToUrlFilterTransformer.transformString(path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), this._postprocesses);
	}
}

class RegexList {
	private readonly _replaces: {regexp: RegExp, newSubstr: string}[];

	public constructor(replaces: ReplaceConfig[]) {
		this._replaces = replaces.map(config => ({
			regexp: new RegExp(config.regexp, "g"),
			newSubstr: config.newSubstr
		}));
	}

	/**
	 * Transforms a single string
	 * @param input the input to transform
	 * @param postprocesses used to replace known special character sequences
	 * @returns the resulting string
	 */
	public transformString(input: string, postprocesses?: { pattern: string, replace: string }[]): string {
		for (const replace of this._replaces) {
			input = input.replaceAll(replace.regexp, replace.newSubstr);
			if (postprocesses != undefined) {
				for (const postprocess of postprocesses) {
					input = input.replaceAll(postprocess.pattern, postprocess.replace);
				}
			}
		}
		return input;
	}
}

export interface ArtifactSchema {
	matchesRepositoryUrl: string,
	componentName: ReplaceConfig[],
	matchesArtifactUrl: string,
	urlToPath: ReplaceConfig[],
	pathToUrl: ReplaceConfig[],
	pathToUrlFilter: ReplaceConfig[]
}

interface ReplaceConfig {
	regexp: string,
	newSubstr: string
}