export namespace main {
	
	export class PDMColumn {
	    id: string;
	    name: string;
	    code: string;
	    dataType?: string;
	    length?: string;
	    precision?: string;
	    scale?: string;
	    mandatory: boolean;
	    comment?: string;
	    isPrimaryKey: boolean;
	    isForeignKey: boolean;
	
	    static createFrom(source: any = {}) {
	        return new PDMColumn(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.code = source["code"];
	        this.dataType = source["dataType"];
	        this.length = source["length"];
	        this.precision = source["precision"];
	        this.scale = source["scale"];
	        this.mandatory = source["mandatory"];
	        this.comment = source["comment"];
	        this.isPrimaryKey = source["isPrimaryKey"];
	        this.isForeignKey = source["isForeignKey"];
	    }
	}
	export class PDMFKJoin {
	    parentColumnId?: string;
	    childColumnId?: string;
	    parentColumn?: string;
	    childColumn?: string;
	
	    static createFrom(source: any = {}) {
	        return new PDMFKJoin(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.parentColumnId = source["parentColumnId"];
	        this.childColumnId = source["childColumnId"];
	        this.parentColumn = source["parentColumn"];
	        this.childColumn = source["childColumn"];
	    }
	}
	export class PDMForeignKey {
	    id: string;
	    name: string;
	    code: string;
	    parentTableId?: string;
	    childTableId?: string;
	    parentTable?: string;
	    childTable?: string;
	    joins?: PDMFKJoin[];
	
	    static createFrom(source: any = {}) {
	        return new PDMForeignKey(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.code = source["code"];
	        this.parentTableId = source["parentTableId"];
	        this.childTableId = source["childTableId"];
	        this.parentTable = source["parentTable"];
	        this.childTable = source["childTable"];
	        this.joins = this.convertValues(source["joins"], PDMFKJoin);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class PDMIndex {
	    id: string;
	    name: string;
	    code: string;
	    unique: boolean;
	    columnIds?: string[];
	    columns?: string[];
	
	    static createFrom(source: any = {}) {
	        return new PDMIndex(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.code = source["code"];
	        this.unique = source["unique"];
	        this.columnIds = source["columnIds"];
	        this.columns = source["columns"];
	    }
	}
	export class PDMSummary {
	    tableCount: number;
	    columnCount: number;
	    referenceCount: number;
	    indexCount: number;
	
	    static createFrom(source: any = {}) {
	        return new PDMSummary(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.tableCount = source["tableCount"];
	        this.columnCount = source["columnCount"];
	        this.referenceCount = source["referenceCount"];
	        this.indexCount = source["indexCount"];
	    }
	}
	export class PDMTable {
	    id: string;
	    name: string;
	    code: string;
	    comment?: string;
	    columns: PDMColumn[];
	    primaryKeys?: string[];
	    foreignKeys?: PDMForeignKey[];
	    indexes?: PDMIndex[];
	
	    static createFrom(source: any = {}) {
	        return new PDMTable(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.code = source["code"];
	        this.comment = source["comment"];
	        this.columns = this.convertValues(source["columns"], PDMColumn);
	        this.primaryKeys = source["primaryKeys"];
	        this.foreignKeys = this.convertValues(source["foreignKeys"], PDMForeignKey);
	        this.indexes = this.convertValues(source["indexes"], PDMIndex);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class PDMModel {
	    filePath: string;
	    name: string;
	    code: string;
	    tables: PDMTable[];
	    summary: PDMSummary;
	    warnings?: string[];
	
	    static createFrom(source: any = {}) {
	        return new PDMModel(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.filePath = source["filePath"];
	        this.name = source["name"];
	        this.code = source["code"];
	        this.tables = this.convertValues(source["tables"], PDMTable);
	        this.summary = this.convertValues(source["summary"], PDMSummary);
	        this.warnings = source["warnings"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	

}

