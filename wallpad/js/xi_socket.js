/**
 * RS485 Homegateway for Commax
 * @소스 공개 : Daehwan, Kang
 * @삼성 홈넷용으로 수정 : erita
 * @수정일 2019-01-11
 * @코맥스 홈넷용으로 수정 : 그레고리하우스
 * @수정일 2019-06-01
 */

const util = require('util');
const SerialPort = require('serialport');
const net = require('net');     // Socket
const mqtt = require('mqtt');

const CONFIG = require('/data/options.json');  //**** 애드온의 옵션을 불러옵니다. 이후 CONFIG.mqtt.username 과 같이 사용가능합니다.

const CONST = {
	// 포트
	port : CONFIG.socket.port,
	ip: CONFIG.socket.deviceIP

	// SerialPort 전송 Delay(ms)
	sendDelay: CONFIG.sendDelay,
	// MQTT 브로커
	mqttBroker: 'mqtt://'+CONFIG.mqtt.server, // *************** 환경에 맞게 수정하세요! **************
	// MQTT 수신 Delay(ms)
	mqttDelay: CONFIG.mqtt.receiveDelay,

	mqttUser: CONFIG.mqtt.username,  // *************** 환경에 맞게 수정하세요! **************
	mqttPass: CONFIG.mqtt.password, // *************** 환경에 맞게 수정하세요! **************

	clientID: CONFIG.model+'-homenet',

	// 기기별 상태 및 제어 코드(HEX)
	DEVICE_STATE: [

		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500020200007d2e','hex'), power1: 0, power2: 0, power3: 'OFF', power4:'OFF'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500020201007d2e','hex'), power1: 0, power2: 0, power3: 'ON', power4:'OFF'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500020201017d2e','hex'), power1: 0, power2: 0, power3: 'ON', power4:'ON'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500020200017d2e','hex'), power1: 0, power2: 0, power3: 'OFF', power4:'ON'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500021300007d2e','hex'), power1: 0, power2: 25, power3: 'OFF', power4:'OFF'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500021301007d2e','hex'), power1: 0, power2: 25, power3: 'ON', power4:'OFF'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500021301017d2e','hex'), power1: 0, power2: 25, power3: 'ON', power4:'ON'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500021300017d2e','hex'), power1: 0, power2: 25, power3: 'OFF', power4:'ON'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500022300007d2e','hex'), power1: 0, power2: 50, power3: 'OFF', power4:'OFF'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500022301007d2e','hex'), power1: 0, power2: 50, power3: 'ON', power4:'OFF'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500022300017d2e','hex'), power1: 0, power2: 50, power3: 'OFF', power4:'ON'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500022301017d2e','hex'), power1: 0, power2: 50, power3: 'ON', power4:'ON'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500023300007d2e','hex'), power1: 0, power2: 75, power3: 'OFF', power4:'OFF'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500023301007d2e','hex'), power1: 0, power2: 75, power3: 'ON', power4:'OFF'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500023300017d2e','hex'), power1: 0, power2: 75, power3: 'OFF', power4:'ON'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500023301017d2e','hex'), power1: 0, power2: 75, power3: 'ON', power4:'ON'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500024300007d2e','hex'), power1: 0, power2: 100, power3: 'OFF', power4:'OFF'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500024301007d2e','hex'), power1: 0, power2: 100, power3: 'ON', power4:'OFF'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500024300017d2e','hex'), power1: 0, power2: 100, power3: 'OFF', power4:'ON'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500024301017d2e','hex'), power1: 0, power2: 100, power3: 'ON', power4:'ON'},

		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500130200007d2e','hex'), power1: 25, power2: 0, power3: 'OFF', power4:'OFF'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500130201007d2e','hex'), power1: 25, power2: 0, power3: 'ON', power4:'OFF'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500130200017d2e','hex'), power1: 25, power2: 0, power3: 'OFF', power4:'ON'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500130201017d2e','hex'), power1: 25, power2: 0, power3: 'ON', power4:'ON'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500131300007d2e','hex'), power1: 25, power2: 25, power3: 'OFF', power4:'OFF'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500131301007d2e','hex'), power1: 25, power2: 25, power3: 'ON', power4:'OFF'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500131300017d2e','hex'), power1: 25, power2: 25, power3: 'OFF', power4:'ON'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500131301017d2e','hex'), power1: 25, power2: 25, power3: 'ON', power4:'ON'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500132300007d2e','hex'), power1: 25, power2: 50, power3: 'OFF', power4:'OFF'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500132301007d2e','hex'), power1: 25, power2: 50, power3: 'ON', power4:'OFF'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500132300017d2e','hex'), power1: 25, power2: 50, power3: 'OFF', power4:'ON'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500132301017d2e','hex'), power1: 25, power2: 50, power3: 'ON', power4:'ON'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500133300007d2e','hex'), power1: 25, power2: 75, power3: 'OFF', power4:'OFF'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500133301007d2e','hex'), power1: 25, power2: 75, power3: 'ON', power4:'OFF'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500133300017d2e','hex'), power1: 25, power2: 75, power3: 'OFF', power4:'ON'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500133301017d2e','hex'), power1: 25, power2: 75, power3: 'ON', power4:'ON'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500134300007d2e','hex'), power1: 25, power2: 100, power3: 'OFF', power4:'OFF'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500134301007d2e','hex'), power1: 25, power2: 100, power3: 'ON', power4:'OFF'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500134300017d2e','hex'), power1: 25, power2: 100, power3: 'OFF', power4:'ON'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500134301017d2e','hex'), power1: 25, power2: 100, power3: 'ON', power4:'ON'},

		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500230200007d2e','hex'), power1: 50, power2: 0, power3: 'OFF', power4:'OFF'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500230201007d2e','hex'), power1: 50, power2: 0, power3: 'ON', power4:'OFF'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500230200017d2e','hex'), power1: 50, power2: 0, power3: 'OFF', power4:'ON'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500230201017d2e','hex'), power1: 50, power2: 0, power3: 'ON', power4:'ON'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500231300007d2e','hex'), power1: 50, power2: 25, power3: 'OFF', power4:'OFF'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500231301007d2e','hex'), power1: 50, power2: 25, power3: 'ON', power4:'OFF'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500231300017d2e','hex'), power1: 50, power2: 25, power3: 'OFF', power4:'ON'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500231301017d2e','hex'), power1: 50, power2: 25, power3: 'ON', power4:'ON'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500232300007d2e','hex'), power1: 50, power2: 50, power3: 'OFF', power4:'OFF'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500232301007d2e','hex'), power1: 50, power2: 50, power3: 'ON', power4:'OFF'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500232300017d2e','hex'), power1: 50, power2: 50, power3: 'OFF', power4:'ON'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500232301017d2e','hex'), power1: 50, power2: 50, power3: 'ON', power4:'ON'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500233300007d2e','hex'), power1: 50, power2: 75, power3: 'OFF', power4:'OFF'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500233301007d2e','hex'), power1: 50, power2: 75, power3: 'ON', power4:'OFF'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500233300017d2e','hex'), power1: 50, power2: 75, power3: 'OFF', power4:'ON'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500233301017d2e','hex'), power1: 50, power2: 75, power3: 'ON', power4:'ON'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500234300007d2e','hex'), power1: 50, power2: 100, power3: 'OFF', power4:'OFF'},,
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500234301007d2e','hex'), power1: 50, power2: 100, power3: 'ON', power4:'OFF'}, ,
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500234300017d2e','hex'), power1: 50, power2: 100, power3: 'OFF', power4:'ON'}, ,
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500234301017d2e','hex'), power1: 50, power2: 100, power3: 'ON', power4:'ON'}, ,

		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500330200007d2e','hex'), power1: 75, power2: 0, power3: 'OFF', power4:'OFF'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500330201007d2e','hex'), power1: 75, power2: 0, power3: 'ON', power4:'OFF'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500330200017d2e','hex'), power1: 75, power2: 0, power3: 'OFF', power4:'ON'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500330201017d2e','hex'), power1: 75, power2: 0, power3: 'ON', power4:'ON'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500331300007d2e','hex'), power1: 75, power2: 25, power3: 'OFF', power4:'OFF'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500331301007d2e','hex'), power1: 75, power2: 25, power3: 'ON', power4:'OFF'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500331300017d2e','hex'), power1: 75, power2: 25, power3: 'OFF', power4:'ON'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500331301017d2e','hex'), power1: 75, power2: 25, power3: 'ON', power4:'ON'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500332300007d2e','hex'), power1: 75, power2: 50, power3: 'OFF', power4:'OFF'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500332301007d2e','hex'), power1: 75, power2: 50, power3: 'ON', power4:'OFF'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500332300017d2e','hex'), power1: 75, power2: 50, power3: 'OFF', power4:'ON'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500332301017d2e','hex'), power1: 75, power2: 50, power3: 'ON', power4:'ON'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500333300007d2e','hex'), power1: 75, power2: 75, power3: 'OFF', power4:'OFF'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500333301007d2e','hex'), power1: 75, power2: 75, power3: 'ON', power4:'OFF'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500333300017d2e','hex'), power1: 75, power2: 75, power3: 'OFF', power4:'ON'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500333301017d2e','hex'), power1: 75, power2: 75, power3: 'ON', power4:'ON'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500334300007d2e','hex'), power1: 75, power2: 100, power3: 'OFF', power4:'OFF'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500334301007d2e','hex'), power1: 75, power2: 100, power3: 'ON', power4:'OFF'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500334300017d2e','hex'), power1: 75, power2: 100, power3: 'OFF', power4:'ON'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500334301017d2e','hex'), power1: 75, power2: 100, power3: 'ON', power4:'ON'},

		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500430200007d2e','hex'), power1: 100, power2: 0, power3: 'OFF', power4:'OFF'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500430201007d2e','hex'), power1: 100, power2: 0, power3: 'ON', power4:'OFF'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500430200017d2e','hex'), power1: 100, power2: 0, power3: 'OFF', power4:'ON'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500430201017d2e','hex'), power1: 100, power2: 0, power3: 'ON', power4:'ON'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500431300007d2e','hex'), power1: 100, power2: 25, power3: 'OFF', power4:'OFF'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500431301007d2e','hex'), power1: 100, power2: 25, power3: 'ON', power4:'OFF'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500431300017d2e','hex'), power1: 100, power2: 25, power3: 'OFF', power4:'ON'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500431301017d2e','hex'), power1: 100, power2: 25, power3: 'ON', power4:'ON'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500432300007d2e','hex'), power1: 100, power2: 50, power3: 'OFF', power4:'OFF'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500432301007d2e','hex'), power1: 100, power2: 50, power3: 'ON', power4:'OFF'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500432300017d2e','hex'), power1: 100, power2: 50, power3: 'OFF', power4:'ON'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500432301017d2e','hex'), power1: 100, power2: 50, power3: 'ON', power4:'ON'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500433300007d2e','hex'), power1: 100, power2: 75, power3: 'OFF', power4:'OFF'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500433301007d2e','hex'), power1: 100, power2: 75, power3: 'ON', power4:'OFF'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500433300017d2e','hex'), power1: 100, power2: 75, power3: 'OFF', power4:'ON'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500433301017d2e','hex'), power1: 100, power2: 75, power3: 'ON', power4:'ON'},
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500434300007d2e','hex'), power1: 100, power2: 100, power3: 'OFF', power4:'OFF'},,
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500434301007d2e','hex'), power1: 100, power2: 100, power3: 'ON', power4:'OFF'}, ,
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500434300017d2e','hex'), power1: 100, power2: 100, power3: 'OFF', power4:'ON'}, ,
		{deviceId: 'Light', subId: '1', stateHex: Buffer.alloc(11,'f70e11810500434301017d2e','hex'), power1: 100, power2: 100, power3: 'ON', power4:'ON'}, ,


		{deviceId: 'Light', subId: '2', stateHex: Buffer.alloc(9,'f70e12810200016904','hex'), power: 'ON'}, //방1등 상태
		{deviceId: 'Light', subId: '2', stateHex: Buffer.alloc(9,'f70e12810200006802','hex'), power: 'OFF'},//방1등 상태
		{deviceId: 'Light', subId: '3', stateHex: Buffer.alloc(9,'f70e13810200016804','hex'), power: 'ON'}, //방2등 상태
		{deviceId: 'Light', subId: '3', stateHex: Buffer.alloc(9,'f70e13810200006904','hex'), power: 'OFF'}, //방2등 상태
		{deviceId: 'Light', subId: '4', stateHex: Buffer.alloc(9,'f70e14810200016f0c','hex'), power: 'ON'}, //방3등 상태
		{deviceId: 'Light', subId: '4', stateHex: Buffer.alloc(9,'f70e14810200006e0a','hex'), power: 'OFF'}, //방3등 상태
		{deviceId: 'Light', subId: '5', stateHex: Buffer.alloc(9,'f70e15810200016e0c','hex'), power: 'ON'}, //방4등 상태
		{deviceId: 'Light', subId: '5', stateHex: Buffer.alloc(9,'f70e15810200006f0c','hex'), power: 'OFF'}, //방4등 상태
	],

	DEVICE_COMMAND: [
		{deviceId: 'Light', subId: '1-1', commandHex: Buffer.alloc(10,'f70e114103010000ab06','hex'), power: 0}, //거실1등
		{deviceId: 'Light', subId: '1-1', commandHex: Buffer.alloc(10,'f70e114103011100ba26','hex'), power: 25}, //거실1등
		{deviceId: 'Light', subId: '1-1', commandHex: Buffer.alloc(10,'f70e1141030121008a06','hex'), power: 50}, //거실1등
		{deviceId: 'Light', subId: '1-1', commandHex: Buffer.alloc(10,'f70e1141030131009a26','hex'), power: 75}, //거실1등
		{deviceId: 'Light', subId: '1-1', commandHex: Buffer.alloc(10,'f70e114103014100ea86','hex'), power: 100}, //거실1등

		{deviceId: 'Light', subId: '1-2', commandHex: Buffer.alloc(10,'f70e114103020000a804','hex'), power: 0}, //거실2등
		{deviceId: 'Light', subId: '1-2', commandHex: Buffer.alloc(10,'f70e114103021100b926','hex'), power: 25}, //거실2등
		{deviceId: 'Light', subId: '1-2', commandHex: Buffer.alloc(10,'f70e1141030221008906','hex'), power: 50}, //거실2등
		{deviceId: 'Light', subId: '1-2', commandHex: Buffer.alloc(10,'f70e1141030231009926','hex'), power: 75}, //거실2등
		{deviceId: 'Light', subId: '1-2', commandHex: Buffer.alloc(10,'f70e114103024100e986','hex'), power: 100}, //거실2등

		{deviceId: 'Light', subId: '1-3', commandHex: Buffer.alloc(10,'f70e114103030100a806','hex'), power: 'ON'}, //거실3등 점등
		{deviceId: 'Light', subId: '1-3', commandHex: Buffer.alloc(10,'f70e114103030000a906','hex'), power: 'OFF' }, //거실3등 소등

		{deviceId: 'Light', subId: '1-3', commandHex: Buffer.alloc(10,'f70e114103040100af0e','hex'), power: 'ON'}, //거실4등 점등 복도등
		{deviceId: 'Light', subId: '1-3', commandHex: Buffer.alloc(10,'f70e114103040000ae0c','hex'), power: 'OFF' }, //거실4등 소등 복도등


		{deviceId: 'Light', subId: '2', commandHex: Buffer.alloc(10,'f70e124103010100a906','hex'), power: 'ON'}, //방1등 점등
		{deviceId: 'Light', subId: '2', commandHex: Buffer.alloc(10,'f70e124103010000a804','hex'), power: 'OFF' }, //방1등 소등
		{deviceId: 'Light', subId: '3', commandHex: Buffer.alloc(10,'f70e134103010100a806','hex'), power: 'ON'}, //방2등 점등
		{deviceId: 'Light', subId: '3', commandHex: Buffer.alloc(10,'f70e134103010000a906','hex'), power: 'OFF' }, //방2등 소등
		{deviceId: 'Light', subId: '4', commandHex: Buffer.alloc(10,'f70e144103010100af0e','hex'), power: 'ON'}, //방3등 점등
		{deviceId: 'Light', subId: '4', commandHex: Buffer.alloc(10,'f70e144103010000ae0c','hex'), power: 'OFF' }, //방3등 소등
		{deviceId: 'Light', subId: '5', commandHex: Buffer.alloc(10,'f70e154103010100ae0e','hex'), power: 'ON'}, //방4등 점등
		{deviceId: 'Light', subId: '5', commandHex: Buffer.alloc(10,'f70e154103010000af0e','hex'), power: 'OFF' }, //방4등 소등
	],

	// 상태 Topic (/homenet/${deviceId}${subId}/${property}/state/ = ${value})
	// 명령어 Topic (/homenet/${deviceId}${subId}/${property}/command/ = ${value})
	TOPIC_PRFIX: 'homenet',
	STATE_TOPIC: 'homenet/%s%s/%s/state', //상태 전달
	DEVICE_TOPIC: 'homenet/+/+/command' //명령 수신

};


// 로그 표시
var log = (...args) => console.log('[' + new Date().toLocaleString('ko-KR', {timeZone: 'Asia/Seoul'}) + ']', args.join(' '));

//////////////////////////////////////////////////////////////////////////////////////
// 홈컨트롤 상태
var homeStatus = {};
var lastReceive = new Date().getTime();
var mqttReady = false;
var queue = new Array();

//////////////////////////////////////////////////////////////////////////////////////
// MQTT-Broker 연결
const client  = mqtt.connect(CONST.mqttBroker, {clientId: CONST.clientID,
	username: CONST.mqttUser,
	password: CONST.mqttPass});
client.on('connect', () => {
	client.subscribe(CONST.DEVICE_TOPIC, (err) => {if (err) log('MQTT Subscribe fail! -', CONST.DEVICE_TOPIC) });
});

//-----------------------------------------------------------
// Socket 모듈 초기화
log('Initializing: Socket');



client = net.connect({port: CONST.port, host: CONST.ip}, function(){

	//////////////////////////////////////////////////////////////////////////////////////
	// 홈넷에서 SerialPort로 상태 정보 수신
	this.on('data', function(data){
		switch (data[3]) {
			case 0x81: //조명 상태 정보
				var objFound = CONST.DEVICE_STATE.find(obj => data.equals(obj.stateHex));
				if(objFound)
					updateStatus(objFound);
				break;
			case 0xc1:
				// Ack 메시지를 받은 명령은 제어 성공하였으므로 큐에서 삭제
				const ack1 = Buffer.alloc(1);
				data.copy(ack1, 0, 1, 2);
				var objFoundIdx = queue.findIndex(obj => obj.commandHex.includes(ack1));
				if(objFoundIdx > -1) {
					log('[Serial] Success command:', data.toString('hex'));
					queue.splice(objFoundIdx, 1);
				}
				break;
		}
	});

});


//////////////////////////////////////////////////////////////////////////////////////
// MQTT로 HA에 상태값 전송
var updateStatus = (obj) => {
	var arrStateName = Object.keys(obj);
	// 상태값이 아닌 항목들은 제외 [deviceId, subId, stateHex, commandHex, ackHex, sentTime]
	const arrFilter = ['deviceId', 'subId', 'stateHex', 'commandHex', 'ackHex', 'sentTime'];
	arrStateName = arrStateName.filter(stateName => !arrFilter.includes(stateName));

	// 상태값별 현재 상태 파악하여 변경되었으면 상태 반영 (MQTT publish)
	arrStateName.forEach( function(stateName) {
		// 상태값이 없거나 상태가 같으면 반영 중지
		var curStatus = homeStatus[obj.deviceId+obj.subId+stateName];
		if(obj[stateName] == null || obj[stateName] === curStatus) return;
		// 미리 상태 반영한 device의 상태 원복 방지
		if(queue.length > 0) {
			var found = queue.find(q => q.deviceId+q.subId === obj.deviceId+obj.subId && q[stateName] === curStatus);
			if(found != null) return;
		}
		// 상태 반영 (MQTT publish)
		homeStatus[obj.deviceId+obj.subId+stateName] = obj[stateName];
		var topic = util.format(CONST.STATE_TOPIC, obj.deviceId, obj.subId, stateName);
		client.publish(topic, obj[stateName], {retain: true});
		log('[MQTT] Send to HA:', topic, '->', obj[stateName]);
	});
}

//////////////////////////////////////////////////////////////////////////////////////
// HA에서 MQTT로 제어 명령 수신
client.on('message', (topic, message) => {
	if(mqttReady) {
		var topics = topic.split('/');
		var value = message.toString(); // message buffer이므로 string으로 변환
		var objFound = null;
		objFound = CONST.DEVICE_COMMAND.find(obj => obj.deviceId+obj.subId === topics[1] && obj[topics[2]] === value);

		if(objFound == null) {
			log('[MQTT] Receive Unknown Msg.: ', topic, ':', value);
			return;
		}

		// 현재 상태와 같으면 Skip
		if(value === homeStatus[objFound.deviceId+objFound.subId+objFound[topics[2]]]) {
			log('[MQTT] Receive & Skip: ', topic, ':', value);
		}
		// Serial메시지 제어명령 전송 & MQTT로 상태정보 전송
		else {
			log('[MQTT] Receive from HA:', topic, ':', value);
			// 최초 실행시 딜레이 없도록 sentTime을 현재시간 보다 sendDelay만큼 이전으로 설정
			objFound.sentTime = (new Date().getTime())-CONST.sendDelay;
			queue.push(objFound);   // 실행 큐에 저장
			updateStatus(objFound); // 처리시간의 Delay때문에 미리 상태 반영
		}
	}
});

//////////////////////////////////////////////////////////////////////////////////////
// SerialPort로 제어 명령 전송

const commandProc = () => {
	// 큐에 처리할 메시지가 없으면 종료
	if(queue.length == 0) return;

	// 기존 홈넷 RS485 메시지와 충돌하지 않도록 Delay를 줌
	var delay = (new Date().getTime())-lastReceive;
	if(delay < CONST.sendDelay) return;

	// 큐에서 제어 메시지 가져오기
	var obj = queue.shift();
	port.write(obj.commandHex, (err) => {if(err)  return log('[Serial] Send Error: ', err.message); });
	lastReceive = new Date().getTime();
	obj.sentTime = lastReceive;     // 명령 전송시간 sentTime으로 저장
	log('[Serial] Send to Device:', obj.deviceId, obj.subId, '->', obj.state, '('+delay+'ms) ', obj.commandHex.toString('hex'));

	// 다시 큐에 저장하여 Ack 메시지 받을때까지 반복 실행
	queue.push(obj);
};

setTimeout(() => {mqttReady=true; log('MQTT Ready...')}, CONST.mqttDelay);
setInterval(commandProc, 20);

