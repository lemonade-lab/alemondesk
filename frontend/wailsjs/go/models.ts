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

export namespace windowyarn {
	
	export class YarnCommandsParams {
	    type: string;
	    value?: string[];
	
	    static createFrom(source: any = {}) {
	        return new YarnCommandsParams(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.type = source["type"];
	        this.value = source["value"];
	    }
	}

}

