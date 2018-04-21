package main

import (
	"net/http"
	"platform_server/server"

	"github.com/gorilla/sessions"
	"github.com/gorilla/websocket"
	"github.com/labstack/echo"
	"github.com/labstack/echo-contrib/session"

	"fmt"
	"time"

	"github.com/labstack/echo/middleware"
)

var (
	upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			// allow all connections by default
			return true
		},
	}
)

func WC() {

	for {
		select {
		case wsdat := <-server.WriteChannel:
			for ws, dat := range wsdat {
				ws.WriteJSON(dat)
			}
		default:

		}

		time.Sleep(time.Microsecond)
	}
}

func gameserver(c echo.Context) error {
	ws, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
	if err != nil {
		return err
	}

	fmt.Println("every time run here") //每次新的用户运行这个

GOB:
	for {
		dat := &server.ReqDat{}
		err := ws.ReadJSON(dat) //阻塞
		if err != nil {
			println("sdaasdasd-->", err.Error()) //数据访问出错了
			goto GOB
		}

		go server.Gs(ws, dat, c)
	}

	return nil
}

func main() {

	e := echo.New()
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(session.Middleware(sessions.NewCookieStore([]byte("secret"))))

	e.Static("/", "./client/public/") //创建服务
	e.GET("/gameserver", gameserver)
	e.GET("/auth/callback", server.AuthCallback)

	gv1 := e.Group("/v1/")
	gv1.POST("user_game_result", server.UserGameResulta)
	gv1.POST("game_result_list", server.GameResultList)
	go WC()

	e.Logger.Fatal(e.Start(":1323"))
}
