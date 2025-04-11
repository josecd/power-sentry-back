export interface ShellyResponse {
    isok: boolean;
    data?: any;
    error?: string;
  }
  
  export interface ShellyStatus {
    ison: boolean;
    has_timer: boolean;
    timer_started: number;
    timer_duration: number;
    timer_remaining: number;
    overpower: boolean;
    overtemperature: boolean;
    temperature: number;
    ext_temperature: {
      tC: number;
      tF: number;
    };
    voltage: number;
    apower: number;
    current: number;
    pf: number;
    freq: number;
    aenergy: {
      total: number;
      by_minute: number[];
      minute_ts: number;
    };
  }