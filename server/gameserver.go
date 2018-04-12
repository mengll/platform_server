package server

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"strconv"
	"time"

	"platform_server/models"

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
		Gender   string `json:"gender"`
		NickName string `json:"nick_name"`
		Avatar   string `json:"avatar"`
		Brithday string `json:"brithday"`
		Ip       string `json:"ip"`

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
	PlatFormUser = make(map[string]map[string]*websocket.Conn) //在线的用户的信息
	PfRedis      = NewRedis()                                  //平台redis
)

func init() {
	PfRedis.Connect()
}

//检查当前的数据格式

func Gs(ws *websocket.Conn,req_data *ReqDat)  error{
	game_id 	:= req_data.Data["game_id"].(string)
	uid     	:= 	strconv.Itoa(IntFromFloat64(req_data.Data["uid"].(float64)))

	Res := ResponeDat{}
	Res.MessageId = req_data.MessageId

	pgevent, err := models.SaveEventLog()
	now_time := time.Now().Unix()

	if err == nil {
		_, err := pgevent.Exec(req_data.Cmd, MaptoJson(req_data.Data), now_time, req_data.MessageId)
		if err != nil {
			fmt.Println("event log save error", err.Error())
		}
	} else {
		fmt.Println("event log error", err.Error())
	}

	if pgevent != nil {
		pgevent.Close()
	}

	switch req_data.Cmd {
	case LOGIN:
		fmt.Println("login")
		udat := new(WSDat)
		udat.Uid = uid
		udat.Avatar = req_data.Data["avatar"].(string)
		udat.GameId = game_id
		udat.NickName = req_data.Data["nick_name"].(string)
		udat.Gender = req_data.Data["gender"].(string)

		pg, pgerr := models.SaveLoginLog()

		if pgerr == nil {
			//`uid`,`game_id`,`ts`,`nick_name`,`gender`,`birth_day`,`ip`,`avatart`
			res, err := pg.Exec(uid, game_id, now_time, udat.NickName, udat.Gender, udat.Brithday, ws.RemoteAddr().String(), udat.Avatar, req_data.MessageId)
			if err != nil {
				fmt.Println(err.Error())
			}
			fmt.Println(res.LastInsertId())
		} else {
			fmt.Println(pgerr.Error())
		}

		if pg != nil {
			pg.Close()
		}

		if _, ok := PlatFormUser[game_id]; !ok {
			PlatFormUser[game_id] = make(map[string]*websocket.Conn)
		}

		PlatFormUser[game_id][uid] = ws
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
				BroadCast(room, game_id, nil) //广播通知当前的玩家，
			}

		} else {
			//加入失败
			Res.ErrorCode = FAILED_BACK
			Res.Msg = "join_room_error"
			ws.WriteJSON(Res)
		}

		//匹配玩家
	case SEARCH_MATCH:
		//ad:= fmt.Sprintf("%d",req_data.Data["user_limit"].(float64)) //游戏匹配的玩家的数量
		room_limit := IntFromFloat64(req_data.Data["user_limit"].(float64))

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
					//PfRedis.delSet(fmt.Sprintf(GAME_REDAY_LIST,game_id),uid) //引出当前用户
					goto TOBE

				default:
					uk := PfRedis.SPop(gameReady)
					if uk != "" {
						dd = append(dd, uk)
					}

					if len(dd) == room_limit {

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
						BroadCast(client_room, game_id, "") //广播通知当前的玩家，
						dd = dd[:0]                         //清空
						break
					}
				}
			}
		}
	TOBE:
		println("end")
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

		//信息传递
	case ROOM_MESSAGE:

		if _, ok := req_data.Data["room"]; !ok {
			Res.ErrorCode = FAILED_BACK
			Res.Msg = "room not found"
			ws.WriteJSON(Res)
		}
		room := req_data.Data["room"].(string)
		game_id := game_id
		data := req_data.Data
		err := BroadCast(room, game_id, data)
		if err != nil {
			panic(err)
		}

		//断线重连
	case RECONNECT:

		if _, ok := req_data.Data["room"]; !ok {
			Res.ErrorCode = FAILED_BACK
			Res.Msg = "room not found"
			ws.WriteJSON(Res)
		}
		room := req_data.Data["room"].(string)

		if PfRedis.hadSet(room, uid) {
			if game, ok := PlatFormUser[game_id]; !ok {
				Res.ErrorCode = FAILED_BACK
				Res.Msg = "game not found"
				ws.WriteJSON(Res)
			} else {
				game[uid] = ws
				jk := make(map[string]interface{})
				jk["info"] = "reconnect"
				BroadCast(room, game_id, jk)
			}
		} else {
			Res.ErrorCode = FAILED_BACK
			Res.Msg = "not found the user"
			ws.WriteJSON(Res)
		}

	} //end switch

	return nil
}

//发送广播
func BroadCast(c_room string, game_id string, data interface{}) error {

	c_data, err := PfRedis.SMembers(c_room)
	if err != nil {
		return err
	}

	room_message := []string{}

	if _, ok := PlatFormUser[game_id]; ok {

		//给房间内的所用玩家同步信息
		for _, v := range c_data {

			if con, oo := PlatFormUser[game_id][v]; oo {

				udat := PfRedis.GetKey(fmt.Sprintf(USER_GAME_KEY, oo))
				Res := ResponeDat{}
				Res.ErrorCode = SUCESS_BACK
				room_message = append(room_message,udat)
				switch data.(type) {
				case string:
					back_data := make(map[string]interface{})
					back_data["uid"] = v
					back_data["info"] = room_message
					back_data["room"] = c_room
					Res.Data = back_data
					Res.Msg = START
				case map[string]interface{}:
					Res.Data = data.(map[string]interface{})
					Res.Msg = ROOM_MESSAGE
				}

				err := con.WriteJSON(Res) //判断用户存在，则发送响应数据
				if err != nil {
					println("发送用户信息失败:")
					return err
				}
			}
		}
	} //end for

	return nil //最终的错误
}

func IntFromFloat64(x float64) int {
	if math.MinInt32 <= x && x <= math.MaxInt32 { // x lies in the integer range
		whole, fraction := math.Modf(x)
		if fraction >= 0.5 {
			whole++
		}
		return int(whole)
	}
	panic(fmt.Sprintf("%g is out of the int32 range", x))
}

func MaptoJson(data map[string]interface{}) string {
	configJSON, err := json.MarshalIndent(data, "", "\t")
	if err != nil {
		return ""
	}
	return string(configJSON) //返回格式化后的字符串的内容0
}
