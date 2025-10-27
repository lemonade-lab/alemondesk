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
	    data?: Record<string, any>;
	
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

