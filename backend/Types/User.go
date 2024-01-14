package Types

import (
	"fmt"
	"github.com/gorilla/websocket"
	"net"
)

type User struct {
	Id        net.Addr
	Conn      *websocket.Conn
	PartnerId net.Addr
	Key       int
}

func NewUser(conn *websocket.Conn) User {
	return User{Conn: conn, Id: conn.RemoteAddr(), PartnerId: nil, Key: 0}
}

type UserPool struct {
	Pool []*User
}

func NewUserPool() UserPool {
	return UserPool{Pool: []*User{}}
}

func (u_p *UserPool) Push(user *User) {
	u_p.Pool = append(u_p.Pool, user)
}

func (u_p *UserPool) Remove(user User) {
	fmt.Println(u_p)
	for i := 0; i < len(u_p.Pool); i++ {
		if u_p.Pool[i].Id == user.Id {
			u_p.Pool = append(u_p.Pool[:i], u_p.Pool[i+1:]...)
			return
		}
	}
}
func (u_p *UserPool) RemoveById(id net.Addr) {
	if id == nil {
		return
	}
	for i := 0; i < len(u_p.Pool); i++ {
		if u_p.Pool[i].Id == id {
			u_p.Pool = append(u_p.Pool[:i], u_p.Pool[i+1:]...)
			return
		}
	}
}
