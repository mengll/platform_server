package server

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	"github.com/gorilla/websocket"
)

type (
	ReqDat struct {
		Cmd        string                 `json:"cmd"`
		Data       map[string]interface{} `json:"data"`
		MessageId  string                 `json:"message_id"`
		MessageKey string                 `json:"message_key"`
	}

	ResponeDat struct {
		ErrorCode int                    `json:"error_code"`
		Data      map[string]interface{} `json:"data"`
		Msg       string                 `json:"msg"`
		MessageId string                 `json:"message_id"`
	}

	UserData struct {
		Uid      string `json:"uid"`
		Gender   int    `json:"gender"`
		NickName string `json:"nick_name"`
		Avatar   string `json:"avatar"`
		Brithday string `json:"brithday"`
	}

	PfError struct {
		Msg        string //错误描述
		Event      string //触发世界
		Error_Time int    //错误触发时间
	}

	WSDat struct {
		UserData
		GameId string
	}

	WsManager interface {
		Login() error
	}
)

//clients_connect
// var PfCdlients map[websocket.Conn] *WSDat

func (self *PfError) Error() string {
	return ""
}

//命令转化服
const (
	START          = "af01"
	LOGIN          = "af02"
	LOGOUT         = "af03"
	CREATE_ROOM    = "af04"
	SEARCH_MATCH   = "af05"
	GAME_HEART     = "af06"
	JOIN_CANCEL    = "af07"
	ROOM_MESSAGE   = "af08"
	OUT_ROOM       = "af09"
	RECONNECT      = "af10"
	NOW_ONLINE_NUM = "af11"
	JOIN_ROOM      = "af12"
	GAME_RESULT    = "af13"
)

var (
	PlatFormUser = make(map[string]map[string]websocket.Conn) //在线的用户的信息
	PfRedis      = NewRedis()                                 //平台redis
)

//检查当前的数据格式
func Gs(ws websocket.Conn, req_data ReqDat) error {
	game_id := req_data.Data["game_id"].(string)
	uid := req_data.Data["uid"].(string)
	message_id := req_data.Data["message_id"].(string)
	Res := ResponeDat{}
	Res.MessageId = message_id
	switch req_data.Cmd {
	case LOGIN:
		fmt.Println("login")
		udat := new(WSDat)
		udat.Uid = uid
		udat.Avatar = req_data.Data["avatar"].(string)
		udat.GameId = game_id
		udat.NickName = req_data.Data["nick_name"].(string)
		udat.Gender = req_data.Data["gender"].(int)

		if game, ok := PlatFormUser[game_id]; !ok {
			PlatFormUser[game_id] = make(map[string]websocket.Conn)
		} else {
			game[uid] = ws
		}

		login_key := fmt.Sprintf(CLIENT_LOGIN_KYE, udat.GameId)
		login_num := PfRedis.getSetNum(login_key)

		//保存用户登录信息
		PfRedis.addSet(login_key, uid)

		//生成用户信息json串
		b, err := json.Marshal(udat) //格式化当前的数据信息
		if err != nil {
			fmt.Println("Encoding User Faild")
		} else {
			PfRedis.setKey(fmt.Sprintf(USER_GAME_KEY, udat.Uid), b)
		}

		back_dat := make(map[string]interface{})
		back_dat["online_num"] = login_num + 1
		back_dat["game_id"] = game_id

		//返回登录
		Res.ErrorCode = SUCESS_BACK
		Res.Msg = ""
		Res.Data = back_dat
		ws.WriteJSON(Res)

		//创建房间
	case CREATE_ROOM:

		user_limit := req_data.Data["UserLimit"].(int)
		new_room := createRoom(game_id)
		limit_key := fmt.Sprintf("%s_limit", new_room)
		println("limit_key =>", limit_key, user_limit)

		//设置房间最大连接人数
		setKey(limit_key, strconv.Itoa(user_limit))
		addSet(new_room, uid)
		room_dat := make(map[string]interface{})
		room_dat["room_id"] = new_room

		Res.ErrorCode = SUCESS_BACK
		Res.Msg = "create_room_sucess"
		Res.Data = room_dat
		ws.WriteJSON(Res)

		//加入房间
	case JOIN_ROOM:

		if _, ok := req_data.Data["room"]; !ok {
			Res.ErrorCode = FAILED_BACK
			Res.Msg = "room not found"
			ws.WriteJSON(Res)
		}
		room := req_data.Data["room"].(string)

		//当前房间的人数
		room_num := getSetNum(room)
		room_limit := PfRedis.GetKey(fmt.Sprintf("%s_limit", room))
		num, err := strconv.Atoi(room_limit)
		if err != nil {
			Res.ErrorCode = FAILED_BACK
			Res.Msg = "room not found"
			ws.WriteJSON(Res)
		}

		println("user_join-->", num, room_num, room)

		if num > room_num {
			//加入成功
			addSet(room, uid)
			Res.ErrorCode = SUCESS_BACK
			now_room_num := getSetNum(room)

			println("join_room_now=>", now_room_num, num)
			if num == now_room_num {
				println("加入完成")
				//start game
				clientBroadCast(room, game_id, "") //广播通知当前的玩家，
			}

		} else {
			//加入失败
			Res.ErrorCode = FAILED_BACK
			Res.Msg = "join_room_error"
			ws.WriteJSON(Res)
		}

		//匹配玩家
	case SEARCH_MATCH:
		room_limit := req_data.Data["user_limit"].(int) //游戏匹配的玩家的数量
		dd := []string{}
		gameReady := fmt.Sprintf(GAME_REDAY_LIST, game_id) //所有准备的用户

		//当前房间的人数
		PfRedis.addSet(gameReady, uid)
		//todo 需要完善
		//设置超时时间

		ctx, _ := context.WithTimeout(context.Background(), time.Second*60)

		//获取当前转呗的玩家的数量
		reday_num := PfRedis.getSetNum(gameReady)
		println("room_limit-->", room_limit)
		println("game_reday", reday_num, room_limit)

		if reday_num >= room_limit {

			for {
				select {

				case <-ctx.Done():
					PfRedis.delSet(fmt.Sprintf(GAME_REDAY_LIST, game_id), uid) //引出当前用户
					println("time out")
					break

				default:

					fmt.Println("game_user_ad->", PfRedis.getSetNum(gameReady))
					uk := PfRedis.SPop(gameReady)
					if uk != "" {
						dd = append(dd, uk)
					}

					println(fmt.Sprintf("匹配玩家%v", dd))

					if len(dd) == room_limit {

						println("匹配到合适玩家啦")

						//创建房间
						client_room := createRoom(game_id)
						user_dat := make(map[string]interface{})

						for _, v := range dd {
							println(v) //广播当前的用户开始游戏
							user_info := PfRedis.GetKey(fmt.Sprintf(USER_GAME_KEY, v))
							user_dat[v] = user_info
							PfRedis.addSet(client_room, v)
						}

						Res.ErrorCode = SUCESS_BACK
						Res.Data = map[string]interface{}{"cmd": "start"}
						Res.Msg = "start"
						clientBroadCast(client_room, game_id, "") //广播通知当前的玩家，
						dd = dd[:0]                               //清空
						break
					}
				}
			}
		}

		//取消匹配
	case JOIN_CANCEL:
		PfRedis.delSet(fmt.Sprintf(GAME_REDAY_LIST, game_id), uid)
		Res.ErrorCode = SUCESS_BACK
		Res.Msg = "cancel_sucess"
		println("取消匹配")
		ws.WriteJSON(Res)

		//退出玩家
	case LOGOUT:
		PfRedis.delSet(fmt.Sprintf(GAME_REDAY_LIST, game_id), uid)
		PfRedis.delSet(fmt.Sprintf(CLIENT_LOGIN_KYE, game_id), uid) //从登陆的数据表中删除
		PfRedis.DelKey(fmt.Sprintf(USER_GAME_KEY, uid))             //删除玩家信息

		delete(PlatFormUser[game_id], uid) //移除ws对象
		Res.ErrorCode = SUCESS_BACK
		Res.Msg = "logout_sucess"
		ws.WriteJSON(Res)

		//现在在线人数
	case NOW_ONLINE_NUM:

		login_key := fmt.Sprintf(CLIENT_LOGIN_KYE, game_id)
		login_num := PfRedis.getSetNum(login_key)

		//当前在线玩家
		nt := time.Now().Unix()
		back := make(map[string]interface{})
		back["user_num"] = login_num
		back["update_time"] = nt

		Res.ErrorCode = SUCESS_BACK
		Res.Data = back
		Res.Msg = "scuess"
		ws.WriteJSON(Res)

		//退出房间
	case OUT_ROOM:
		if _, ok := req_data.Data["room"]; !ok {
			Res.ErrorCode = FAILED_BACK
			Res.Msg = "room not found"
			ws.WriteJSON(Res)
		}
		room := req_data.Data["room"].(string)
		PfRedis.delSet(room, uid)

		Res.ErrorCode = SUCESS_BACK
		Res.Msg = "out_room_sucess"

		room_num := PfRedis.getSetNum(room)
		if room_num == 0 {
			PfRedis.DelKey(room)
		}
		ws.WriteJSON(Res)

		println("玩家退出房间")

	}
	return nil
}
