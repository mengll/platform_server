package models

import (
	"platform_server/libs/db"
	"database/sql"
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
	run_sql := "insert into gp_user_login_log (uid , game_id , ts , nick_name , gender , birth_day , ip , avatar , message_id) values " +
		"($1,$2,$3,$4,$5,$6,$7,$8,$9)"
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