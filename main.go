package main

import (
	"platform_server/server"

	"github.com/gorilla/websocket"
	"github.com/labstack/echo"

	"github.com/labstack/echo/middleware"

)

var (
	upgrader = websocket.Upgrader{}
)

func gameserver(c echo.Context) error {
	ws, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
	if err != nil {
		return err
	}
GOB:
	for {
		dat := &server.ReqDat{}
		err := ws.ReadJSON(dat) //阻塞
		if err != nil {
			println("sdaasdasd-->", err.Error()) //数据访问出错了
			goto GOB
		}

		go server.Gs(ws, dat)
	}

	return nil
}

func main() {
	e := echo.New()
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
//	e.Use(session.Middleware(sessions.NewCookieStore([]byte("secret"))))

	e.Static("/", "./public") //创建服务

	e.GET("/gameserver", gameserver)

	//auth.Route(e)

	e.Logger.Fatal(e.Start(":1323"))
}
