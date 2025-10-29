export namespace windowapp {
	
	export class PathsState {
	    userDataTemplatePath: string;
	    userDataNodeModulesPath: string;
	    userDataPackagePath: string;
	    preloadPath: string;
	    logMainPath: string;
	
	    static createFrom(source: any = {}) {
	        return new PathsState(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.userDataTemplatePath = source["userDataTemplatePath"];
	        this.userDataNodeModulesPath = source["userDataNodeModulesPath"];
	        this.userDataPackagePath = source["userDataPackagePath"];
	        this.preloadPath = source["preloadPath"];
	        this.logMainPath = source["logMainPath"];
	    }
	}

}

export namespace windowcontroller {
	
	export class Versions {
	    version: string;
	    node: string;
	    platform: string;
	    arch: string;
	    compiler: string;
	
	    static createFrom(source: any = {}) {
	        return new Versions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.version = source["version"];
	        this.node = source["node"];
	        this.platform = source["platform"];
	        this.arch = source["arch"];
	        this.compiler = source["compiler"];
	    }
	}

}

export namespace windowexpansions {
	
	export class ExpansionsPostMessageParams {
	    type: string;
	    data?: string;
	
	    static createFrom(source: any = {}) {
	        return new ExpansionsPostMessageParams(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.type = source["type"];
	        this.data = source["data"];
	    }
	}

}

export namespace windowgit {
	
	export class GitCloneOptions {
	    Space: string;
	    RepoURL: string;
	    Branch: string;
	    Depth: number;
	    Force: boolean;
	
	    static createFrom(source: any = {}) {
	        return new GitCloneOptions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Space = source["Space"];
	        this.RepoURL = source["RepoURL"];
	        this.Branch = source["Branch"];
	        this.Depth = source["Depth"];
	        this.Force = source["Force"];
	    }
	}
	export class GitRepoInfo {
	    Name: string;
	    IsFullRepo: boolean;
	    RemoteURL: string;
	    Branch: string;
	    LastCommit: string;
	
	    static createFrom(source: any = {}) {
	        return new GitRepoInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Name = source["Name"];
	        this.IsFullRepo = source["IsFullRepo"];
	        this.RemoteURL = source["RemoteURL"];
	        this.Branch = source["Branch"];
	        this.LastCommit = source["LastCommit"];
	    }
	}

}

export namespace windowyarn {
	
	export class YarnCommandsParams {
	    type: string;
	    args?: string[];
	
	    static createFrom(source: any = {}) {
	        return new YarnCommandsParams(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.type = source["type"];
	        this.args = source["args"];
	    }
	}

}

