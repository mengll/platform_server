package server

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"strconv"
	"strings"
	"time"

	"platform_server/anfeng"
	"platform_server/models"

	"github.com/gorilla/websocket"
	"github.com/labstack/echo"

	"net/http"
	"platform_server/libs/db"
)

type (
	ReqDat struct {
		Cmd        string                 `json:"cmd"`
		Data       map[string]interface{} `json:"data"`
		MessageId  string                 `json:"message_id"`
		MessageKey string                 `json:"message_key"`
	}

	ResponeDat struct {
		ErrorCode int         `json:"error_code"`
		Data      interface{} `json:"data"`
		Msg       string      `json:"msg"`
		MessageId string      `json:"message_id"`
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

	Gmresult struct {
		Uid       string
		Score     int
		GameId    string
		MessageID string
	}

	UserGameResult struct {
		NickName string `json:"nick_name"`
		Avatar   string `json:"avatar"`
		PlayNum  int    `json:"play_num"`
		WinNum   int    `json:"win_num"`
		WinPoint int    `json:"win_point"`
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
	AUTHORIZE      = "af14"
	TIME_OUT       = "af15"
	DISCONNECT     = "af16"
	ONLINE         = "af17"
	USER_MESSAGE   = "af18"
	ENTER_GAME     = "af19"

	ONLINE_KEY = "ONE_LINE:%s"
)

var (
	PlatFormUser = make(map[string]map[string]*websocket.Conn) //在线的用户的信息
	PfRedis      = NewRedis()                                  //平台redis
	auth         = anfeng.Auth{
		BaseURL:  "http://i.anfeng.com",
		ClientID: "101",
	}
	//数据写入通道
	WriteChannel chan map[*websocket.Conn]interface{} = make(chan map[*websocket.Conn]interface{})
	UIDS                                              = make(map[*websocket.Conn]string)
)

func init() {
	PfRedis.Connect()
	go ClearnDisconnect()
}

//检查当前的数据格式

func Gs(ws *websocket.Conn, req_data *ReqDat, c echo.Context) error {
	Res := ResponeDat{}
	Res.MessageId = req_data.MessageId

	pgevent, err := models.SaveEventLog()
	now_time := time.Now().Unix()

	if err == nil {
		_, err := pgevent.Exec(req_data.Cmd, MaptoJson(req_data.Data), now_time, req_data.MessageId)
		if err != nil {
			fmt.Println("event log save error", err.Error())
		}
	}

	if pgevent != nil {
		pgevent.Close()
	}

	switch req_data.Cmd {
	case AUTHORIZE:
		authorizeURL := auth.AuthorizeURL("http://"+c.Request().Host+"/auth/callback", "STATE")
		data := make(map[string]interface{})
		data["url"] = authorizeURL
		Res.ErrorCode = SUCESS_BACK
		Res.Data = data
		Res.Msg = ""
		ws.WriteJSON(Res)

	case LOGIN:

		fmt.Println("login")

		accessToken := req_data.Data["access_token"].(string)
		profile, err := auth.Profile(accessToken)
		if err != nil {
			Res.ErrorCode = FAILED_BACK
			Res.Msg = err.Error()
			ws.WriteJSON(Res)
			return err
		}

		// uid := strconv.Itoa(req_data.Data["uid"].(int) )

		fmt.Printf("%v",profile)
		fmt.Println("玩家性别:",profile.Gender)
		uid := strconv.Itoa(profile.UID)
		udat := new(WSDat)
		udat.Uid = strconv.Itoa(profile.UID)
		udat.Avatar = profile.Avatar
		udat.NickName = profile.UserName
		udat.Gender = strconv.Itoa(profile.Gender)
		udat.Brithday = profile.Birthday
		UIDS[ws] = udat.Uid
		//保存玩家信息
		saveUser, user_err := models.SaveUser()
		if user_err == nil {
			//uid , nick_name , avtar , births_day , gender  , ts , ip
			_, err := saveUser.Exec(uid, udat.NickName, udat.Avatar, udat.Brithday, udat.Gender, now_time, ws.RemoteAddr().String())
			if err != nil {
				fmt.Println(err.Error())
			}
			fmt.Println("保存用户信息")

			if saveUser != nil {
				saveUser.Close()
			}
		} else {
			fmt.Println(user_err.Error())
			//返回登录
			Res.ErrorCode = FAILED_BACK
			Res.Msg = user_err.Error()
			ws.WriteJSON(Res)
			break
		}

		b, err := json.Marshal(udat) //格式化当前的数据信息
		if err != nil {
			fmt.Println("Encoding User Faild")
		} else {
			PfRedis.setKey(fmt.Sprintf(USER_GAME_KEY, udat.Uid), b)
		}

		//返回登录
		Res.ErrorCode = SUCESS_BACK
		Res.Msg = ""
		Res.Data = udat
		ws.WriteJSON(Res)

	//进入游戏是初始化信息
	case ENTER_GAME:
		game_id := req_data.Data["game_id"].(string)

		uid := UIDS[ws]
		if uid == "" {
			fmt.Println("uid is not allowed by nil")
			break
		}

		fmt.Println("enter_game=>", game_id, uid)
		//保存用户登录信息
		login_key := fmt.Sprintf(CLIENT_LOGIN_KYE, game_id)
		login_num := PfRedis.getSetNum(login_key)
		PfRedis.addSet(login_key, uid)

		online_key := fmt.Sprintf(ONLINE_KEY, uid)
		PfRedis.Expire(online_key, time.Second*3000)

		pg, pgerr := models.SaveLoginLog()

		if pgerr == nil {
			//uid , game_id , ts , ip, message_id , data
			_, err := pg.Exec(uid, game_id, now_time, ws.RemoteAddr().String(), req_data.MessageId, MaptoJson(req_data.Data))

			if err != nil {
				fmt.Println(err.Error())
			}

			if pg != nil {
				pg.Close()
			}
		} else {
			fmt.Println(pgerr.Error())
			Res.ErrorCode = SUCESS_BACK
			Res.Msg = pgerr.Error()
			ws.WriteJSON(Res)
			break
		}

		if _, ok := PlatFormUser[game_id]; !ok {
			PlatFormUser[game_id] = make(map[string]*websocket.Conn)
		}
		PlatFormUser[game_id][uid] = ws

		back_dat := make(map[string]interface{})
		back_dat["online_num"] = login_num
		back_dat["game_id"] = game_id

		//返回登录
		Res.ErrorCode = SUCESS_BACK
		Res.Msg = ""
		Res.Data = back_dat
		ws.WriteJSON(Res)

		//创建房间
	case CREATE_ROOM:
		uid := UIDS[ws]
		game_id := req_data.Data["game_id"].(string)
		user_limit := int(req_data.Data["user_limit"].(float64))
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
		uid := UIDS[ws]
		game_id := req_data.Data["game_id"].(string)

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
				BroadCast(room, game_id, "") //广播通知当前的玩家，
			}

		} else {
			//加入失败
			Res.ErrorCode = FAILED_BACK
			Res.Msg = "join_room_error"
			ws.WriteJSON(Res)
		}

		//匹配玩家
	case SEARCH_MATCH:
		uid := UIDS[ws]

		game_id := req_data.Data["game_id"].(string)
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
					//PfRedis.delSet(fmt.Sprintf(GAME_REDAY_LIST, game_id), uid) //引出当前用户
					Res.ErrorCode = FAILED_BACK
					Res.Msg = TIME_OUT
					ws.WriteJSON(Res)
					goto TOBE

				default:
					uk := PfRedis.SPop(gameReady)
					is_exists, err := PfRedis.EXISTS(fmt.Sprintf(ONLINE_KEY, uk))
					if err != nil {
						fmt.Println(err)
						continue
					}
					if uk != "" && is_exists == true {
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
						Res.Msg = START
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

		uid := UIDS[ws]
		game_id := req_data.Data["game_id"].(string)
		PfRedis.delSet(fmt.Sprintf(GAME_REDAY_LIST, game_id), uid)
		Res.ErrorCode = SUCESS_BACK
		Res.Msg = "cancel_sucess"
		println("取消匹配")
		ws.WriteJSON(Res)

		//退出玩家
	case LOGOUT:
		uid := req_data.Data["uid"].(string)

		game_id := req_data.Data["game_id"].(string)
		PfRedis.delSet(fmt.Sprintf(GAME_REDAY_LIST, game_id), uid)
		PfRedis.delSet(fmt.Sprintf(CLIENT_LOGIN_KYE, game_id), uid) //从登陆的数据表中删除
		PfRedis.DelKey(fmt.Sprintf(USER_GAME_KEY, uid))             //删除玩家信息

		delete(PlatFormUser[game_id], uid) //移除ws对象
		Res.ErrorCode = SUCESS_BACK
		Res.Msg = "logout_sucess"
		ws.WriteJSON(Res)

		//现在在线人数
	case NOW_ONLINE_NUM:
		game_id := req_data.Data["game_id"].(string)
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
		uid := UIDS[ws]
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

		if _, ishad := req_data.Data["game_id"].(string); !ishad {
			Res.ErrorCode = FAILED_BACK
			Res.Msg = "game_id is not found"
			ws.WriteJSON(Res)
			break
		}
		if _, ok := req_data.Data["room"]; !ok {
			Res.ErrorCode = FAILED_BACK
			Res.Msg = "room not found"
			ws.WriteJSON(Res)
		}
		game_id := req_data.Data["game_id"].(string)
		room := req_data.Data["room"].(string)
		data := req_data.Data
		err := BroadCast(room, game_id, data)
		if err != nil {
			panic(err)
		}

		//断线重连
	case RECONNECT:
		uid := req_data.Data["uid"].(string)

		game_id := req_data.Data["game_id"].(string)
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
				jk["info"] = RECONNECT
				BroadCast(room, game_id, jk)
			}

		} else {
			Res.ErrorCode = FAILED_BACK
			Res.Msg = "not found the user"
			ws.WriteJSON(Res)
		}

		//心跳
	case GAME_HEART:
		uid := UIDS[ws]
		online_key := fmt.Sprintf(ONLINE_KEY, uid)
		PfRedis.Expire(online_key, time.Second*3)
		Res.ErrorCode = SUCESS_BACK
		Res.Msg = ONLINE

		ws.WriteJSON(Res)

		//游戏结果上报
	case GAME_RESULT:
		uid := UIDS[ws]
		room := req_data.Data["room"].(string)
		res_key := fmt.Sprintf(ROOM_RESULT_KEY, room)
		user_limit := getSetNum(room)
		result_num := getSetNum(res_key)
		data := req_data.Data
		fmt.Println(req_data.Data)
		score := strconv.Itoa(int(req_data.Data["value"].(float64)))
		text := req_data.Data["text"].(string)
		extra := req_data.Data["extra"].(map[string]interface{})
		println(data)
		pg, err := models.SaveResult()
		if err != nil {
			return err
		}
		game_id := req_data.Data["game_id"].(string)
		//game_id , uid , score , text ,extra ,room ,ts,message_id
		_, pg_err := pg.Exec(game_id, uid, score, text, MaptoJson(extra), room, now_time, Res.MessageId)

		if pg_err != nil {
			pg.Close()
			fmt.Println(pg_err.Error())
			return nil
		}

		if pg != nil {
			pg.Close()
		}

		if user_limit > result_num {
			addSet(res_key, "'"+Res.MessageId+"'")
			result_num := getSetNum(res_key)
			if result_num == user_limit {
				//结果数据处理分发
				rows, err := models.Pg.(*db.Pg).Db.Query("select uid ,score ,game_id,message_id from gp_game_result where room in('" + room + "') order by score desc ")
				if err != nil {
					fmt.Println(err.Error())
				}

				scores := []Gmresult{}
				for rows.Next() {
					res_dat := Gmresult{}
					uid := ""
					game_id := ""
					score := 0
					message_id := ""
					rows.Scan(&uid, &score, &game_id, &message_id)
					res_dat.MessageID = message_id
					res_dat.Uid = uid
					res_dat.GameId = game_id
					res_dat.Score = score
					scores = append(scores, res_dat)
				}
				save_score, s_err := models.SaveWinScore()
				if s_err != nil {
					fmt.Println(s_err.Error())
				}
				//todo 现在处理的2人数据后期添加多人数据比较需要优化 game_conf 后期保存到redis中
				if (scores[0].Score - scores[1].Score) > 0 {
					fmt.Println("【游戏结果播报】", scores, game_id)
					//game_id , play_num , win_num , uid , win_score
					back_dat := make(map[string]string)
					back_dat["result"] = "win"
					back_dat["win_point"] = "15"
					Res.Data = back_dat
					Res.MessageId = scores[0].MessageID

					con := PlatFormUser[scores[0].GameId][scores[0].Uid]
					mp := make(map[*websocket.Conn]interface{})
					mp[con] = Res
					//game_id , play_num , win_num , uid , win_score
					save_score.Exec(game_id, 1, 1, scores[0].Uid, 15)
					WriteChannel <- mp

					back_dat["result"] = "lose"
					back_dat["win_point"] = "0"
					Res.Data = back_dat
					Res.MessageId = scores[1].MessageID
					con = PlatFormUser[scores[1].GameId][scores[1].Uid]
					mp[con] = Res
					save_score.Exec(game_id, 1, 0, scores[1].Uid, 0)
					WriteChannel <- mp

				}

				if (scores[0].Score - scores[1].Score) == 0 {
					fmt.Println("【游戏结果播报2】", scores)
					back_dat := make(map[string]string)
					back_dat["result"] = "draw"
					back_dat["win_point"] = "0"
					Res.Data = back_dat
					Res.MessageId = scores[0].MessageID
					fmt.Println(scores[0].GameId, scores[0].Uid)
					con := PlatFormUser[scores[0].GameId][scores[0].Uid]
					mp := make(map[*websocket.Conn]interface{})
					mp[con] = Res
					save_score.Exec(game_id, 1, 0, scores[0].Uid, 0)
					WriteChannel <- mp

					back_dat["result"] = "draw"
					back_dat["win_point"] = "0"
					Res.Data = back_dat
					Res.MessageId = scores[1].MessageID
					con = PlatFormUser[scores[1].GameId][scores[1].Uid]
					mp[con] = Res
					save_score.Exec(game_id, 1, 0, scores[1].Uid, 0)
					WriteChannel <- mp

				}
				defer save_score.Close()

			}
		}

	//user message
	case USER_MESSAGE:
		uid := req_data.Data["uid"].(string)
		game_id := req_data.Data["game_id"].(string)
		data := req_data.Data["data"]

		notify := ResponeDat{
			ErrorCode: SUCESS_BACK,
			Data:      data,
			Msg:       USER_MESSAGE,
		}

		err := PlatFormUser[game_id][uid].WriteJSON(notify)
		if err != nil {
			Res.ErrorCode = FAILED_BACK
			Res.Msg = err.Error()
			ws.WriteJSON(Res)
		} else {
			Res.ErrorCode = SUCESS_BACK
			ws.WriteJSON(Res)
		}

	} //end switch

	return nil
}

func AuthCallback(c echo.Context) error {
	accessToken, err := auth.AccessToken("http://"+c.Request().Host+"/auth/callback", "STATE", c.QueryParam("code"))
	if err != nil {
		return err
	}

	return c.Redirect(302, "http://"+strings.Split(c.Request().Host, ":")[0]+":3000/#/authorize/"+accessToken)
}

//发送广播
func BroadCast(c_room string, game_id string, data interface{}) error {
	fmt.Println("调用广播")
	fmt.Println(c_room)
	c_data, err := PfRedis.SMembers(c_room)
	if err != nil {
		return err
	}
	fmt.Println(game_id)
	if _, ok := PlatFormUser[game_id]; ok {
		//给房间内的所用玩家同步信息
		for _, v := range c_data {
			fmt.Println("--bt->", v)
			if con, oo := PlatFormUser[game_id][v]; oo {
				Res := ResponeDat{}
				Res.ErrorCode = SUCESS_BACK
				println("123->")
				switch data.(type) {
				case string:
					room_message := []map[string]interface{}{}
					for _, v := range c_data {
						udat := PfRedis.GetKey(fmt.Sprintf(USER_GAME_KEY, v))
						room_message = append(room_message, StrToMap(udat))
					}
					back_data := make(map[string]interface{})
					back_data["uid"] = v
					back_data["info"] = room_message
					back_data["room"] = c_room
					Res.Data = back_data
					Res.Msg = START

					fmt.Println(room_message)
				case map[string]interface{}:
					Res.Data = data.(map[string]interface{})
					Res.Msg = ROOM_MESSAGE
				}

				is_exists, err := PfRedis.EXISTS(fmt.Sprintf(ONLINE_KEY, v))
				if err != nil {
					fmt.Println(err)
					continue
				}
				//todo 并发写入问题
				if is_exists {
					mp := make(map[*websocket.Conn]interface{})
					mp[con] = Res
					WriteChannel <- mp
					online_key := fmt.Sprintf(ONLINE_KEY, v)
					PfRedis.Expire(online_key, time.Second*3)
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

//map 转字符串
func MaptoJson(data map[string]interface{}) string {
	configJSON, err := json.MarshalIndent(data, "", "\t")
	if err != nil {
		return ""
	}
	return string(configJSON) //返回格式化后的字符串的内容0
}

//str to map
func StrToMap(data string) map[string]interface{} {
	var dat map[string]interface{}
	json.Unmarshal([]byte(data), &dat)
	return dat
}

//清除用户信息

func ClearUser(game_id,uid string){

	is_exists, err := PfRedis.EXISTS(fmt.Sprintf(ONLINE_KEY, uid))

	if err != nil {
		fmt.Println(err)
	}

	//不存在
	if !is_exists{
		PfRedis.delSet(fmt.Sprintf(GAME_REDAY_LIST, game_id), uid)
		PfRedis.delSet(fmt.Sprintf(CLIENT_LOGIN_KYE, game_id), uid) //从登陆的数据表中删除
		delete(PlatFormUser[game_id], uid)                          //移除ws对象                    															//移除ws对象
	}
}

//清除断线的用户信息
func ClearnDisconnect() {
	interval_clearn := time.NewTicker(time.Second * 3)
	for {
		select {
		case <-interval_clearn.C:
			fmt.Println("clear user")
			for game_id, v := range PlatFormUser {
				for uid, _ := range v {
					ClearUser(game_id,uid) //清除用户信息
				}

				//删除缓存中的用户信息
				users,errs := PfRedis.SMembers(fmt.Sprintf(CLIENT_LOGIN_KYE, game_id))

				if errs != nil{
					fmt.Println(errs.Error())
					continue
				}

				for _,uid := range users{
					ClearUser(game_id,uid)
				}

			}

		}
	}
}

//获取
func UserGameResulta(c echo.Context) error {
	vals, err := c.FormParams()
	if err != nil {
		return err
	}
	uid := vals.Get("uid")
	game_id := vals.Get("game_id")
	userres := UserGameResult{}
	runsql := "select u.nick_name,u.avatar,o.play_num,o.win_num,o.win_point from gp_users as u left join gp_user_game_info as o on u.uid = o.uid where o.game_id = '%s' and o.uid = '%s'"
	fmt.Println(fmt.Sprintf(runsql, game_id, uid))

	row := models.Pg.(*db.Pg).Db.QueryRow(fmt.Sprintf(runsql, game_id, uid))
	err = row.Scan(&userres.NickName, &userres.Avatar, &userres.PlayNum, &userres.WinNum, &userres.WinPoint)

	Res := ResponeDat{}

	if err == nil {
		Res.ErrorCode = SUCESS_BACK
		Res.Data = userres
	} else {
		user_sql := "select nick_name,avatar from gp_users where uid ='%s'"
		row := models.Pg.(*db.Pg).Db.QueryRow(fmt.Sprintf(user_sql, uid))
		row.Scan(&userres.NickName, &userres.Avatar)

		Res.ErrorCode = SUCESS_BACK
		Res.Data = userres
		Res.Msg = err.Error()
	}

	return c.JSON(http.StatusOK, Res)

}

//游戏结果列表
func GameResultList(c echo.Context) error {

	vals, err := c.FormParams()
	if err != nil {
		return err
	}

	game_id := vals.Get("game_id")
	userres_list := []UserGameResult{}
	runsql := "select u.nick_name,u.avatar,o.play_num,o.win_num,o.win_point from gp_users as u left join gp_user_game_info as o on u.uid = o.uid where o.game_id = '%s' order by o.win_point desc "
	rows, err := models.Pg.(*db.Pg).Db.Query(fmt.Sprintf(runsql, game_id))

	if err != nil {
		fmt.Println(err.Error())
	}

	for rows.Next() {
		userres := UserGameResult{}
		err = rows.Scan(&userres.NickName, &userres.Avatar, &userres.PlayNum, &userres.WinNum, &userres.WinPoint)
		userres_list = append(userres_list, userres)
	}

	rows.Close()
	Res := ResponeDat{}

	if err == nil {
		Res.ErrorCode = SUCESS_BACK
		Res.Data = userres_list
	} else {
		Res.ErrorCode = SUCESS_BACK
		Res.Data = userres_list
		Res.Msg = err.Error()
	}
	return c.JSON(http.StatusOK, Res)
}

func TimeOut() {
	const t = 10
	time.Now().Add(t * time.Second) //当前的超时的操作的过程使用这样的方式控制超时的操作
}
