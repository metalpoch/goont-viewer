export namespace main {
	
	export class ExportSheet {
	    name: string;
	    data: any[];
	
	    static createFrom(source: any = {}) {
	        return new ExportSheet(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.data = source["data"];
	    }
	}
	export class ExportData {
	    data: any[];
	    sheets: ExportSheet[];
	
	    static createFrom(source: any = {}) {
	        return new ExportData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.data = source["data"];
	        this.sheets = this.convertValues(source["sheets"], ExportSheet);
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

export namespace model {
	
	export class ChartDataPoint {
	    date: string;
	    valueIn: number;
	    valueOut: number;
	
	    static createFrom(source: any = {}) {
	        return new ChartDataPoint(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.date = source["date"];
	        this.valueIn = source["valueIn"];
	        this.valueOut = source["valueOut"];
	    }
	}
	export class GlobalSummary {
	    avgBpsIn: number;
	    avgBpsOut: number;
	    totalBytesIn: number;
	    totalBytesOut: number;
	
	    static createFrom(source: any = {}) {
	        return new GlobalSummary(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.avgBpsIn = source["avgBpsIn"];
	        this.avgBpsOut = source["avgBpsOut"];
	        this.totalBytesIn = source["totalBytesIn"];
	        this.totalBytesOut = source["totalBytesOut"];
	    }
	}
	export class GponMeasurement {
	    // Go type: time
	    time: any;
	    gpon_interface: string;
	    total_bytes_in: number;
	    total_bytes_out: number;
	    total_bps_in: number;
	    total_bps_out: number;
	    count_active: number;
	    count_inactive: number;
	    count_error: number;
	
	    static createFrom(source: any = {}) {
	        return new GponMeasurement(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.time = this.convertValues(source["time"], null);
	        this.gpon_interface = source["gpon_interface"];
	        this.total_bytes_in = source["total_bytes_in"];
	        this.total_bytes_out = source["total_bytes_out"];
	        this.total_bps_in = source["total_bps_in"];
	        this.total_bps_out = source["total_bps_out"];
	        this.count_active = source["count_active"];
	        this.count_inactive = source["count_inactive"];
	        this.count_error = source["count_error"];
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
	export class GponTableRow {
	    gponIdx: string;
	    interfaceName: string;
	    avgBpsIn: number;
	    avgBpsOut: number;
	    avgBytesIn: number;
	    avgBytesOut: number;
	    totalBytesIn: number;
	    totalBytesOut: number;
	
	    static createFrom(source: any = {}) {
	        return new GponTableRow(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.gponIdx = source["gponIdx"];
	        this.interfaceName = source["interfaceName"];
	        this.avgBpsIn = source["avgBpsIn"];
	        this.avgBpsOut = source["avgBpsOut"];
	        this.avgBytesIn = source["avgBytesIn"];
	        this.avgBytesOut = source["avgBytesOut"];
	        this.totalBytesIn = source["totalBytesIn"];
	        this.totalBytesOut = source["totalBytesOut"];
	    }
	}
	export class OLT {
	    ip: string;
	    community: string;
	    name: string;
	    location: string;
	    timeout?: number;
	    retries?: number;
	    // Go type: time
	    created_at?: any;
	    // Go type: time
	    updated_at?: any;
	
	    static createFrom(source: any = {}) {
	        return new OLT(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ip = source["ip"];
	        this.community = source["community"];
	        this.name = source["name"];
	        this.location = source["location"];
	        this.timeout = source["timeout"];
	        this.retries = source["retries"];
	        this.created_at = this.convertValues(source["created_at"], null);
	        this.updated_at = this.convertValues(source["updated_at"], null);
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
	export class OntMeasurement {
	    // Go type: time
	    time: any;
	    status: number;
	    temperature: number;
	    olt_distance: number;
	    tx_power: number;
	    rx_power: number;
	    bps_in: number;
	    bps_out: number;
	    bytes_in: number;
	    bytes_out: number;
	    desp: string;
	    serial_number: string;
	    plan: string;
	
	    static createFrom(source: any = {}) {
	        return new OntMeasurement(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.time = this.convertValues(source["time"], null);
	        this.status = source["status"];
	        this.temperature = source["temperature"];
	        this.olt_distance = source["olt_distance"];
	        this.tx_power = source["tx_power"];
	        this.rx_power = source["rx_power"];
	        this.bps_in = source["bps_in"];
	        this.bps_out = source["bps_out"];
	        this.bytes_in = source["bytes_in"];
	        this.bytes_out = source["bytes_out"];
	        this.desp = source["desp"];
	        this.serial_number = source["serial_number"];
	        this.plan = source["plan"];
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
	export class OntTableRow {
	    ontIdx: string;
	    desp: string;
	    sn: string;
	    plan: string;
	    distance: number;
	    status: number;
	    avgBpsIn: number;
	    avgBpsOut: number;
	    avgBytesIn: number;
	    avgBytesOut: number;
	    totalBytesIn: number;
	    totalBytesOut: number;
	
	    static createFrom(source: any = {}) {
	        return new OntTableRow(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ontIdx = source["ontIdx"];
	        this.desp = source["desp"];
	        this.sn = source["sn"];
	        this.plan = source["plan"];
	        this.distance = source["distance"];
	        this.status = source["status"];
	        this.avgBpsIn = source["avgBpsIn"];
	        this.avgBpsOut = source["avgBpsOut"];
	        this.avgBytesIn = source["avgBytesIn"];
	        this.avgBytesOut = source["avgBytesOut"];
	        this.totalBytesIn = source["totalBytesIn"];
	        this.totalBytesOut = source["totalBytesOut"];
	    }
	}
	export class ProcessedGponData {
	    tableData: GponTableRow[];
	    globalSummary: GlobalSummary;
	    globalChartTraffic: ChartDataPoint[];
	    globalChartVolume: ChartDataPoint[];
	    rawData?: Record<string, Array<GponMeasurement>>;
	
	    static createFrom(source: any = {}) {
	        return new ProcessedGponData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.tableData = this.convertValues(source["tableData"], GponTableRow);
	        this.globalSummary = this.convertValues(source["globalSummary"], GlobalSummary);
	        this.globalChartTraffic = this.convertValues(source["globalChartTraffic"], ChartDataPoint);
	        this.globalChartVolume = this.convertValues(source["globalChartVolume"], ChartDataPoint);
	        this.rawData = this.convertValues(source["rawData"], Array<GponMeasurement>, true);
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
	export class ProcessedOntData {
	    tableData: OntTableRow[];
	    summary: GlobalSummary;
	    chartTraffic: ChartDataPoint[];
	    chartVolume: ChartDataPoint[];
	    rawData?: Record<string, Array<OntMeasurement>>;
	
	    static createFrom(source: any = {}) {
	        return new ProcessedOntData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.tableData = this.convertValues(source["tableData"], OntTableRow);
	        this.summary = this.convertValues(source["summary"], GlobalSummary);
	        this.chartTraffic = this.convertValues(source["chartTraffic"], ChartDataPoint);
	        this.chartVolume = this.convertValues(source["chartVolume"], ChartDataPoint);
	        this.rawData = this.convertValues(source["rawData"], Array<OntMeasurement>, true);
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

