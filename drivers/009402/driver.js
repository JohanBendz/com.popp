"use strict";

const path          = require('path');
const ZwaveDriver   = require('homey-zwavedriver');

module.exports = new ZwaveDriver( path.basename(__dirname), {
    debug: true,
    capabilities: {
			'onoff': {
				'command_class': 'COMMAND_CLASS_SWITCH_BINARY',
	            'command_get': 'SWITCH_BINARY_GET',
	            'command_set': 'SWITCH_BINARY_SET',
				'command_set_parser': value => {
		              return {
			                 'Switch Value': (value > 0) ? 'on/enable' : 'off/disable'
		                   };
				},
	            'command_report': 'SWITCH_BINARY_REPORT',
            	'command_report_parser': report => report['Value'] === 'on/enable'
			},
			'alarm_smoke': [
						{
						getOnWakeUp: true,
						command_class: 'COMMAND_CLASS_SENSOR_ALARM',
						command_get: 'SENSOR_ALARM_GET',
						command_get_parser: node => {
							if (node && typeof node.state.alarm_smoke === 'undefined') {
							module.exports.realtime(node.device_data, 'alarm_smoke', false);
							}
							return {
								'Sensor Type': 'Smoke Alarm',
							}
						},
						command_report: 'SENSOR_ALARM_REPORT',
						command_report_parser: report => {
							if (report['Sensor Type'] !== 'Smoke Alarm') return null;
							return report['Sensor State'] === 'alarm';
						},
					},
					{
						command_class: 'COMMAND_CLASS_NOTIFICATION',
						command_report: 'NOTIFICATION_REPORT',
						command_report_parser: report => {
							if (report && report['Notification Type'] === 'Smoke') {
								if (report['Event'] === 1 || report['Event'] === 2 || report['Event'] === 3) return true;
								return false
							}
							return null;
						},
					},
					{
						command_class: 'COMMAND_CLASS_BASIC',
						command_report: 'BASIC_SET',
						command_report_parser: report => {
							if (report && report.hasOwnProperty('Value')) return report.Value === 255;
							return null;
						},
					},
			],			
			'alarm_tamper': {
				command_class: 'COMMAND_CLASS_NOTIFICATION',
				command_get: 'NOTIFICATION_GET',
				command_get_parser: () => ({
					'V1 Alarm Type': 0,
					'Notification Type': 'Home Security',
					Event: 3,
				}),
				command_report: 'NOTIFICATION_REPORT',
				command_report_parser: report => {
				if (report['Notification Type'] === 'Home Security' &&
					report.hasOwnProperty('Event')) {
						if (report['Event (Parsed)'] === 'Tampering, Product covering removed') {
							return true;
						}
						if (report['Event (Parsed)'] === 'Event inactive' &&
							report.hasOwnProperty('Event Parameter') &&
							report['Event Parameter'][0] === 3) {
						return false;
						}
	
						return null;
					}
				},
			},
			'alarm_battery': { 
    			'command_class': 'COMMAND_CLASS_BATTERY',
	    		'command_get': 'BATTERY_GET',
    			'command_report': 'BATTERY_REPORT',
    			'command_report_parser': (report, node) => { 
    				if(report.hasOwnProperty('Battery Level (Raw)')) {
    					if (report['Battery Level (Raw)'][0] == 255) {
    						return true
    						}
    					return false
   	        			}
   					}		
			},
			'measure_battery': { 
    			getOnWakeUp: true,
    			'command_class': 'COMMAND_CLASS_BATTERY',
	    		'command_get': 'BATTERY_GET',
    			'command_report': 'BATTERY_REPORT',
    			'command_report_parser': (report, node) => { 
    				if(report.hasOwnProperty('Battery Level (Raw)')) {
    					if(report['Battery Level (Raw)'][0] == 255) return 1;
        				return report['Battery Level (Raw)'][0];
						}
					return null;
    			}
			}
		},
  settings: {
            "1": {
				"index": 1,
				"size": 1,
            },
			"2": {
				"index": 2,
				"size": 1,
            },
			"3": {
				"index": 3,
				"size": 1,
            },
			"4": {
				"index": 4,
				"size": 1,
            }
        }
	}
);

Homey.manager('flow').on('action.sound_alarm', function( callback, args ){
	Homey.log('');
	Homey.log('on flow action.action.sound_alarm');
	Homey.log('args', args);

	Homey.manager('drivers').getDriver('009402').capabilities.onoff.set(args.device, true, function (err, data) {
		Homey.log('');
		Homey.log('Homey.manager(drivers).getDriver(009402).capabilities.onoff.set');
		Homey.log('err', err);
		Homey.log('data', data);
		if (err) callback (err, false);
	});

	callback( null, true );
});

Homey.manager('flow').on('action.silence_alarm', function( callback, args ){
	Homey.log('');
	Homey.log('on flow action.action.silence_alarm');
	Homey.log('args', args);

	Homey.manager('drivers').getDriver('009402').capabilities.onoff.set(args.device, false, function (err, data) {
		Homey.log('');
		Homey.log('Homey.manager(drivers).getDriver(009402).capabilities.onoff.set');
		Homey.log('err', err);
		Homey.log('data', data);
		if (err) callback (err, false);
	});

	callback( null, true );
});
