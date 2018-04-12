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
}


class Client {
    socket = new WebSocket('ws://localhost:1323/gameserver');
    pending = {}
    seq = 0;

    _connected = false;

    constructor() {
        this.socket.onmessage = (event) => {
            const { error_code, data, msg, message_id: seq } = JSON.parse(event.data);
            
            const response = {
                success: error_code == 1,
                result: data,
                message: msg
            }

            const callback = this.pending[seq];
            
            if (callback) {
                delete this.pending[seq];
                callback(response);
            } else {
                this.notify(response)
            }
        }

        this.socket.addEventListener('open', () => {
            this._connected = true;
        })

    }

    notify(response) {
        console.log('notify', response);
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
                    data: params,
                    message_key: "",
                    message_id: this.seq.toString()
                }

                this.pending[this.seq] = (response) => {
                    resolve(response)
                }

                this.socket.send(JSON.stringify(action))
            }
        )
    }
    
}

export default new Client()