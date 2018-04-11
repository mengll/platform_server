package main

import (
	"github.com/labstack/echo/middleware"
	"github.com/labstack/echo"
	"github.com/gorilla/websocket"
	"platform_server/server"
)

var (
	upgrader = websocket.Upgrader{}
)

func gameserver(c echo.Context) error{
	ws, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
	if err != nil {
		return err
	}
GOB:
	for{
		dat := &server.UserDat{}
		err := ws.ReadJSON(dat) //阻塞
		if err != nil{
			println("sdaasdasd-->",err.Error()) //数据访问出错了
			goto GOB
		}
		go server.WsInit(ws,dat)
	}

	return nil
}

func main() {
	e := echo.New()
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Static("/", "./public") //创建服务
	e.GET("/gameserver", gameserver)
	e.Logger.Fatal(e.Start(":1323"))
}