package auth

import (
	"fmt"
	"net/http"
	"platform_server/anfeng"

	"github.com/gorilla/sessions"
	"github.com/labstack/echo"
	"github.com/labstack/echo-contrib/session"
)

func login(c echo.Context) error {
	auth := new(anfeng.Auth)
	auth.BaseURL = "http://192.168.1.53:82"
	auth.ClientID = "101"
	url := auth.AuthorizeURL("http://localhost:1323/auth/callback", "STATE")
	return c.Redirect(302, url)
}

func callback(c echo.Context) error {
	auth := new(anfeng.Auth)
	auth.BaseURL = "http://192.168.1.53:82"
	auth.ClientID = "101"

	token, err := auth.AccessToken("http://localhost:1323/auth/callback", "STATE", c.QueryParam("code"))
	if err != nil {
		return err
	}
	sess, _ := session.Get("session", c)
	sess.Options = &sessions.Options{
		Path:     "/",
		MaxAge:   86400 * 7,
		HttpOnly: true,
	}
	sess.Values["access_token"] = token
	sess.Save(c.Request(), c.Response())
	return c.NoContent(http.StatusOK)
}

func profile(c echo.Context) error {
	sess, _ := session.Get("session", c)
	token := sess.Values["access_token"].(string)

	fmt.Println("token:", token)
	auth := new(anfeng.Auth)
	auth.BaseURL = "http://192.168.1.53:82"
	auth.ClientID = "101"

	profile, err := auth.Profile(token)
	fmt.Println(profile, err)

	return nil
}

//Route auth
func Route(e *echo.Echo) {
	e.GET("/auth/login", login)
	e.GET("/auth/callback", callback)
	e.GET("/auth/profile", profile)
}
