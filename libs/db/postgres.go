package db
import (
	"database/sql"
	"fmt"
	_ "github.com/lib/pq"
	"strconv"
)

type (
	Pg struct {
		Db      *sql.DB
    }

	Dbdat struct {
		Host     string
		User     string
		PassWord string
		Port     string
		DataBase string
	}
)

var PgConfAdt Dbdat = Dbdat{
	Host		: "192.168.1.241", //"192.168.1.53",
	PassWord	: "adttianyan",
	Port		: "4453",//"5432",
	User		: "regina",
	DataBase	: "game_platform",
}

type Pginterface interface{
	PgConnect()
	Pgclose()
	Prepure(str string) (*sql.Stmt,error)
	Ping() error
}

//pgconnect 处理当前的数据库路链接

func (self *Pg) PgConnect() {
	defer func() {
		if err := recover(); err != nil {
			fmt.Println("pg connect error", err)
		}
	}()

	var err error
	port, era := strconv.Atoi(PgConfAdt.Port)

	if era != nil {
		fmt.Println("端口转化错误")
	}

	psqlInfo := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable", PgConfAdt.Host, port, PgConfAdt.User, PgConfAdt.PassWord, PgConfAdt.DataBase)

	self.Db, err = sql.Open("postgres", psqlInfo)

	if err != nil {
		fmt.Print("pg connect err")
		panic("PG connect error")
	}

	erra := self.Db.Ping()

	if erra != nil {
		fmt.Println("pg connect error")
	}

}

//关闭当前链接
func (self *Pg) Pgclose() {
	self.Db.Close()
}

//创建预处理语句  Prepare("insert into user(name, sex)values($1,$2)")
func (self *Pg) Prepure(str string)(*sql.Stmt,error){
	Pgstmt, err := self.Db.Prepare(str)
	return Pgstmt,err
}

//检查当前是链接
func (self *Pg) Ping() error {
	err := self.Db.Ping()
	if err != nil {
		return err
	}
	return nil
}

//创建新的pg对象
func NewPg() Pginterface{
	return &Pg{}
}