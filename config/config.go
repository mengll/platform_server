package config

import (
	"encoding/json"
	"errors"
	"io/ioutil"
	"strings"
)

//Config 配置
type Config struct {
	content []byte
}

//New 配置实例
func New(filename string) (c *Config) {
	content, err := ioutil.ReadFile(filename)
	if err != nil {
		panic(err)
	}
	c = &Config{content}
	return
}

//Default 默认配置实例
var Default = New("./config.json")

//Get 读取配置
func (config *Config) Get(name string, v interface{}) (err error) {
	keys := strings.Split(name, ".")
	c := config.content
	ok := false
	for _, k := range keys {
		var m = map[string]json.RawMessage{}
		json.Unmarshal(c, &m)
		c, ok = m[k]
		if !ok {
			return errors.New("config: unmarshal error " + name)
		}
	}
	return json.Unmarshal(c, v)
}

//Get 读取默认配置
func Get(name string, v interface{}) (err error) {
	return Default.Get(name, v)
}
