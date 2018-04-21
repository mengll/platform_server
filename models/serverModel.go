package models

import (
	"platform_server/libs/db"
	"database/sql"
	"fmt"
)
var Pg db.Pginterface

func init(){
	Pg = db.NewPg()
	Pg.PgConnect()
}

//log login
func SaveLoginLog()(*sql.Stmt,error){
	err := Pg.Ping()
	if err !=nil{
		return nil,err
	}
	run_sql := "insert into gp_user_login_log (uid , game_id , ts , ip, message_id , data) values " +
		"($1,$2,$3,$4,$5,$6)"
	return Pg.Prepure(run_sql)
}

//保存eventda
func SaveEventLog()(*sql.Stmt,error){
	err := Pg.Ping()
	if err !=nil{
		return nil,err
	}
	run_sql := "insert into gp_event_log(event , data , ts ,message_id) values ($1,$2,$3,$4)"
	return Pg.Prepure(run_sql)
}

//保存游戏结果
func SaveResult()(*sql.Stmt,error){
	err := Pg.Ping()
	if err !=nil{
		return nil,err
	}
	run_sql := "insert into gp_game_result(game_id , uid , score , text ,extra ,room ,ts,message_id) values ($1,$2,$3,$4,$5,$6,$7,$8)"
	return Pg.Prepure(run_sql)
}

//保存用户信息
func SaveUser() (*sql.Stmt,error){
	err := Pg.Ping()
	if err !=nil{
		fmt.Println("save_user_err",err.Error())
		return nil,err
	}
	run_sql := "insert into gp_users (uid , nick_name , avatar , birth_day , gender  , ts , ip) values " +
		"($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (uid) DO UPDATE set nick_name = excluded.nick_name"
	return Pg.Prepure(run_sql)
}

//保存玩家胜点
func SaveWinScore() (*sql.Stmt,error){
	err := Pg.Ping()
	if err !=nil{
		return nil,err
	}
	run_sql := "insert into gp_user_game_info (game_id , play_num , win_num , uid , win_point) values " +
		"($1,$2,$3,$4,$5) ON CONFLICT (uid,game_id) DO UPDATE set  play_num =  gp_user_game_info.play_num +1,win_num = gp_user_game_info.win_num + excluded.win_num,win_point = gp_user_game_info.win_point + excluded.win_point"

	return Pg.Prepure(run_sql)
}
//ON CONFLICT (uid,game_id) DO UPDATE set  play_num =  play_num +1,win_num = win_num + excluded.win_num,win_score = win_score + excluded.win_score
