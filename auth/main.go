package auth

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"platform_server/config"
	"strings"
)

//Response Http response interface
type Response interface {
	IsSuccess() bool
}

//Auth 安锋通行证登录
type Auth struct {
	BaseURL  string `json:"base_url"`
	ClientID string `json:"client_id"`
}

//CIResponse 安锋CI框架API响应
type CIResponse struct {
	Code    int         `json:"status"`
	Message string      `json:"info"`
	Payload interface{} `json:"data"`
}

//AccountProfileData 用户信息
type AccountProfileData struct {
	UID      int    `json:"uid"`
	UserName string `json:"username"`
	Mobile   string `json:"mobile"`
	Email    string `json:"email"`
	Balance  string `json:"balance"`
	Gender   int    `json:"gender"`
	Birthday string `json:"birthday"`
	Province string `json:"province"`
	City     string `json:"city"`
	Address  string `json:"address"`
	Avatar   string `json:"avatar"`
	RealName string `json:"real_name"`
	CardNo   string `json:"card_no"`
	Exp      int    `json:"exp"`
	Vip      int    `json:"vip"`
	Score    int    `json:"score"`
	IsReal   bool   `json:"is_real"`
	IsAdult  bool   `json:"is_adult"`
	RegTime  int    `json:"reg_time"`
	RegType  int    `json:"regtype"`
	RID      int    `json:"rid"`
	RType    int    `json:"rtype"`
}

//AccessTokenResponse AccessToken 接口响应
type AccessTokenResponse struct {
	CIResponse
	Payload struct {
		AccessToken string `json:"access_token"`
		ExpiresIn   int    `json:"expires_in"`
	} `json:"data"`
}

//ProfileResponse 用户信息
type ProfileResponse struct {
	CIResponse
	Payload AccountProfileData `json:"data"`
}

//IsSuccess API响应是否成功
func (resp *CIResponse) IsSuccess() bool {
	return resp.Code == 1
}

//AuthorizeURL 生成获取 code 的跳转链接
func (auth *Auth) AuthorizeURL(redirectURI string, state string) string {
	params := url.Values{}

	params.Set("client_id", auth.ClientID)
	params.Set("redirect_uri", redirectURI)
	params.Set("state", state)

	return auth.BaseURL + "/anfengauth/get_code?" + params.Encode()
}

//AccessToken 用 code 换取用户 token
func (auth *Auth) AccessToken(redirectURI string, state string, code string) (string, error) {
	params := url.Values{}

	params.Set("client_id", auth.ClientID)
	params.Set("redirect_uri", redirectURI)
	params.Set("code", code)
	params.Set("state", state)

	response := new(AccessTokenResponse)
	err := Get(auth.BaseURL+"/anfengauth/get_token", params, response)

	if err != nil {
		return "", err
	}

	if !response.IsSuccess() {
		return "", errors.New(response.Message)
	}

	return response.Payload.AccessToken, nil
}

//Profile 获取用户信息
func (auth *Auth) Profile(accessToken string) (AccountProfileData, error) {

	params := url.Values{}
	params.Set("access_token", accessToken)

	resp := new(ProfileResponse)
	err := Get(auth.BaseURL+"/anfengauth/get_user_info", params, resp)

	if err != nil {
		return resp.Payload, err
	}

	if !resp.IsSuccess() {
		return resp.Payload, errors.New(resp.Message)
	}

	return resp.Payload, nil
}

//Get HTTP GET METHOD Unmarshal JSON
func Get(url string, params url.Values, v Response) error {
	if params != nil {
		if strings.Contains(url, "?") {
			url += "&"
		} else {
			url += "?"
		}
		url += params.Encode()
	}

	return Unmarshal(
		func() (*http.Response, error) {
			return http.Get(url)
		}, v)
}

//Post HTTP POST METHOD Unmarshal JSON
func Post(url string, params url.Values, v Response) error {
	return Unmarshal(
		func() (*http.Response, error) {
			return http.PostForm(url, params)
		}, v)
}

//Unmarshal JSON字符串解编
func Unmarshal(request func() (*http.Response, error), v interface{}) error {
	var (
		resp *http.Response
		err  error
	)

	resp, err = request()

	if err != nil {
		return err
	}

	defer resp.Body.Close()

	var data []byte
	data, err = ioutil.ReadAll(resp.Body)
	fmt.Println(string(data))
	if err != nil {
		return err
	}
	return json.Unmarshal(data, v)
}

//New Auth
func New(name string) (auth *Auth) {
	auth = &Auth{}
	if err := config.Get(name, auth); err != nil {
		panic(err)
	}
	return
}

//Default Auth
var Default = New("auth")
