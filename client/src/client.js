import EventEmitter from "eventemitter2";


// START          = "af01"
// LOGIN          = "af02"
// LOGOUT         = "af03"
// CREATE_ROOM    = "af04"
// SEARCH_MATCH   = "af05"
// GAME_HEART     = "af06"
// JOIN_CANCEL    = "af07"
// ROOM_MESSAGE   = "af08"
// OUT_ROOM       = "af09"
// RECONNECT      = "af10"
// NOW_ONLINE_NUM = "af11"
// JOIN_ROOM      = "af12"
// GAME_RESULT    = "af13"
// AUTHORIZE      = "af14"
// TIME_OUT       = "af15"
// DISCONNECT     = "af16"
// ONLINE         = "af17"
// USER_MESSAGE   = "af18"
// ENTER_GAME	   = "af19"

const routes = {
    start: 'af01',
    login: 'af02',
    logout: 'af03',
    create_room: 'af04',
    search_match: 'af05',
    game_heart: 'af06',
    join_cancel: 'af07',
    room_message: 'af08',
    out_room: 'af09',
    reconnect: 'af10',
    now_online_num: 'af11',
    join_room: 'af12',
    game_result: 'af13',
    authorize: 'af14',
    online: 'af17',
    enter_game: 'af19'
}

const cmds = {
    'af01': 'start',
    'af02': 'login',
    'af03': 'logout',
    'af04': 'create_room',
    'af05': 'search_match',
    'af06': 'game_heart',
    'af07': 'join_cancel',
    'af08': 'room_message',
    'af09': 'out_room',
    'af10': 'reconnect',
    'af11': 'now_online_num',
    'af12': 'join_room',
    'af13': 'game_result',
    'af14': 'authorize',
    'af17': 'online',
    'af19': 'enter_game'
}

const game_id = "1998";
class Client extends EventEmitter {
    socket = new WebSocket('ws://localhost:1323/gameserver');
    pending = {}
    seq = 0;

    _connected = false;

    constructor() {
        super();

        this.socket.onmessage = (event) => {
            const pack = JSON.parse(event.data);

            const { error_code, data, msg, message_id: seq } = pack;

            const success = error_code === 0;

            const response = {
                success,
                result: data,
                message: msg
            }

            const callback = this.pending[seq];
            
            if (callback) {
                // RESPONSE
                delete this.pending[seq];
                callback(response);
            } else {
                // NOTIFY
                const method = cmds[msg];
                if (method === undefined) {
                    console.log('client.notify.unknow', pack);
                } else {
                    if (success) {
                        this.notify({
                            method,
                            params: data
                        })
                    }
                }
            }
        }

        this.socket.addEventListener('open', () => {
            this._connected = true;
        })

    }

    notify(event) {
        console.log('notify', event);
        const {method, params} = event;
        this.emit(`notify.${method}`, params);
    }

    async connected() {
        if (this._connected) {
            return;
        } else {
            return new Promise(resolve => {
                this.socket.addEventListener('open', () => {
                    resolve();
                })
            })
        }
    }




    async call(method, params) {
        await this.connected();
        
        const cmd = routes[method];
        
        if (cmd === undefined) {
            throw new Error("Unknow method!");
        }

        return new Promise(
            (resolve) => {
                ++this.seq;

                const action = {
                    cmd,
                    data: {...params},
                    message_key: "",
                    message_id: this.seq.toString()
                }

                this.pending[this.seq] = (response) => {
                    console.log('client.call', {method, params, response});
                    resolve(response)
                }

                this.socket.send(JSON.stringify(action))
            }
        )
    }

    async push(method, params) {
        console.log('client.push', {method, params});
        await this.connected();
        
        const cmd = routes[method];
        
        if (cmd === undefined) {
            throw new Error("Unknow method!");
        }

        return new Promise(
            (resolve) => {
                ++this.seq;

                const action = {
                    cmd,
                    data: {...params},
                    message_key: "",
                    message_id: this.seq.toString()
                }

                this.socket.send(JSON.stringify(action))

                resolve();
            }
        )
    }
    
}

export default new Client()